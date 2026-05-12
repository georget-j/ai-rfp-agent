export const maxDuration = 60

import { NextRequest } from 'next/server'
import * as z from 'zod'
import { retrieveChunks } from '@/lib/retrieval'
import { generateRFPResponse } from '@/lib/generation'
import { verifyCitations } from '@/lib/citations'
import { getServiceSupabase } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import type { SupabaseClient } from '@supabase/supabase-js'

const BatchRequestSchema = z.object({
  rfp_title: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.number(),
        section: z.string(),
        text: z.string(),
      }),
    )
    .min(1)
    .max(100),
})

type Question = z.infer<typeof BatchRequestSchema>['questions'][number]

const encoder = new TextEncoder()
const CONCURRENCY = 5

function sseEvent(type: string, payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ type, ...payload as object })}\n\n`)
}

async function processQuestion(
  question: Question,
  controller: ReadableStreamDefaultController,
  supabase: SupabaseClient,
  rfpRunId: string,
  rfpTitle: string | undefined,
) {
  controller.enqueue(sseEvent('start', { question_id: question.id }))
  try {
    const [{ data: queryRecord }, retrievedChunks] = await Promise.all([
      supabase
        .from('queries')
        .insert({
          query_text: question.text,
          rfp_context: { section: question.section, rfp_run_id: rfpRunId, rfp_title: rfpTitle },
        })
        .select('id')
        .single(),
      retrieveChunks(question.text),
    ])

    const rawResponse = await generateRFPResponse(question.text, retrievedChunks)
    const retrievedIds = new Set(retrievedChunks.map((c) => c.id))
    const { response } = verifyCitations(rawResponse, retrievedIds)

    if (queryRecord) {
      await supabase.from('query_results').insert({
        query_id: queryRecord.id,
        answer: response,
        retrieved_chunk_ids: [...retrievedIds],
      })
    }

    controller.enqueue(
      sseEvent('result', {
        question_id: question.id,
        question_text: question.text,
        section: question.section,
        response,
        retrieved_chunks: retrievedChunks,
      }),
    )
  } catch (err) {
    controller.enqueue(
      sseEvent('question_error', {
        question_id: question.id,
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
    )
  }
}

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'ask')
  if (limited) return limited

  let questions: Question[]
  let rfpTitle: string | undefined
  try {
    const body = await request.json()
    const parsed = BatchRequestSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid request'
      return new Response(JSON.stringify({ error: msg }), { status: 400 })
    }
    questions = parsed.data.questions
    rfpTitle = parsed.data.rfp_title
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const rfpRunId = crypto.randomUUID()
  const supabase = getServiceSupabase()

  const stream = new ReadableStream({
    async start(controller) {
      // Process in parallel batches to stay within the 60s function timeout
      for (let i = 0; i < questions.length; i += CONCURRENCY) {
        const batch = questions.slice(i, i + CONCURRENCY)
        await Promise.all(batch.map((q) => processQuestion(q, controller, supabase, rfpRunId, rfpTitle)))
      }

      controller.enqueue(sseEvent('done', { total: questions.length }))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
