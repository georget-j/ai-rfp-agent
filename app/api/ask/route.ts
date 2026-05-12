import { NextRequest, NextResponse } from 'next/server'
import { streamObject } from 'ai'
import { getServiceSupabase } from '@/lib/supabase'
import { retrieveChunks } from '@/lib/retrieval'
import { verifyCitations } from '@/lib/citations'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { AskRequestSchema, RFPResponseSchema } from '@/lib/schema'
import type { RFPContext } from '@/lib/schema'
import { checkRateLimit } from '@/lib/rate-limit'
import { aiOpenAI, CHAT_MODEL } from '@/lib/openai'
import { routeAnswersForReview } from '@/lib/review-routing'
import type { RFPResponse } from '@/lib/schema'

const SUGGESTED_OWNER_TO_TOPIC: Record<string, string> = {
  engineering: 'engineering',
  legal: 'legal',
  commercial: 'commercial',
  customer: 'support',
  product: 'general',
  unknown: 'general',
}

function deriveRouting(response: RFPResponse, ctx?: RFPContext | null): { topic: string; riskLevel: string } {
  // Use the LLM's own suggested_owner from missing_information — most frequent non-unknown wins
  const owners = (response.missing_information ?? [])
    .map((m) => m.suggested_owner)
    .filter((o) => o !== 'unknown')

  if (owners.length > 0) {
    const counts = owners.reduce<Record<string, number>>((acc, o) => {
      acc[o] = (acc[o] ?? 0) + 1
      return acc
    }, {})
    const topOwner = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
    const topic = SUGGESTED_OWNER_TO_TOPIC[topOwner] ?? 'general'
    const riskLevel = topic === 'legal' || topic === 'security_compliance' ? 'high' : 'medium'
    return { topic, riskLevel }
  }

  // Fall back to rfp_context response_type
  switch (ctx?.response_type) {
    case 'security-compliance': return { topic: 'security_compliance', riskLevel: 'high' }
    case 'technical-answer':    return { topic: 'technical',           riskLevel: 'medium' }
    case 'implementation-approach': return { topic: 'implementation',  riskLevel: 'medium' }
    case 'case-study':          return { topic: 'commercial',          riskLevel: 'low' }
    default:                    return { topic: 'general',             riskLevel: 'medium' }
  }
}

const encoder = new TextEncoder()

function sseEvent(type: string, payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ type, ...payload as object })}\n\n`)
}

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'ask')
  if (limited) return limited

  try {
    const body = await request.json()
    const parsed = AskRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { query, rfp_context } = parsed.data
    const supabase = getServiceSupabase()

    // Retrieval and query record creation in parallel
    const [{ data: queryRecord, error: queryError }, retrievedChunks] = await Promise.all([
      supabase
        .from('queries')
        .insert({ query_text: query, rfp_context: rfp_context ?? null })
        .select('id')
        .single(),
      retrieveChunks(query),
    ])

    if (queryError || !queryRecord) {
      throw new Error(`Failed to store query: ${queryError?.message}`)
    }

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(query, retrievedChunks, rfp_context)

    const { partialObjectStream, object: objectPromise } = streamObject({
      model: aiOpenAI(CHAT_MODEL),
      schema: RFPResponseSchema,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxOutputTokens: 1500,
    })

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send retrieval metadata immediately so the UI can show sources
          controller.enqueue(
            sseEvent('meta', { query_id: queryRecord.id, retrieved_chunks: retrievedChunks }),
          )

          for await (const partial of partialObjectStream) {
            controller.enqueue(sseEvent('partial', { object: partial }))
          }

          // Verify citations and persist once generation is complete
          const rawResponse = await objectPromise
          const retrievedIds = new Set(retrievedChunks.map((c) => c.id))
          const { response, removedCount } = verifyCitations(rawResponse, retrievedIds)

          if (removedCount > 0) {
            console.warn(`[ask] Stripped ${removedCount} unverified citation(s)`)
          }

          await supabase.from('query_results').insert({
            query_id: queryRecord.id,
            answer: response,
            retrieved_chunk_ids: [...retrievedIds],
          })

          const { topic, riskLevel } = deriveRouting(response, rfp_context)
          const routed = await routeAnswersForReview(
            [{
              queryId: queryRecord.id,
              questionText: query,
              section: 'Single Question',
              topic,
              riskLevel,
              response,
            }],
            undefined,
            query.slice(0, 80),
          ).catch((err) => { console.error('[ask] routing error:', err); return 0 })

          controller.enqueue(sseEvent('done', { removed_citations: removedCount, routed }))
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          console.error('[ask]', message)
          controller.enqueue(sseEvent('error', { message }))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ask]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
