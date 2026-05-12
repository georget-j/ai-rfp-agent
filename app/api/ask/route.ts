import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { retrieveChunks } from '@/lib/retrieval'
import { generateRFPResponse } from '@/lib/generation'
import { verifyCitations } from '@/lib/citations'
import { AskRequestSchema } from '@/lib/schema'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'ask')
  if (limited) return limited

  try {
    const body = await request.json()
    const parsed = AskRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { query, rfp_context } = parsed.data
    const supabase = getServiceSupabase()

    // Store query
    const { data: queryRecord, error: queryError } = await supabase
      .from('queries')
      .insert({ query_text: query, rfp_context: rfp_context ?? null })
      .select('id')
      .single()

    if (queryError || !queryRecord) {
      throw new Error(`Failed to store query: ${queryError?.message}`)
    }

    // Retrieve relevant chunks
    const retrievedChunks = await retrieveChunks(query)

    // Generate structured response
    const rawResponse = await generateRFPResponse(query, retrievedChunks, rfp_context)

    // Strip any citations the LLM invented that weren't in the retrieved set
    const retrievedIds = new Set(retrievedChunks.map((c) => c.id))
    const { response, removedCount } = verifyCitations(rawResponse, retrievedIds)

    if (removedCount > 0) {
      console.warn(`[ask] Stripped ${removedCount} unverified citation(s) not in retrieved set`)
    }

    // Store result
    await supabase.from('query_results').insert({
      query_id: queryRecord.id,
      answer: response,
      retrieved_chunk_ids: [...retrievedIds],
    })

    return NextResponse.json({
      query_id: queryRecord.id,
      response,
      retrieved_chunks: retrievedChunks,
      unverified_citations_removed: removedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ask]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
