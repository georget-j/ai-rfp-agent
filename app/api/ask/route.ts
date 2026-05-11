import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { retrieveChunks } from '@/lib/retrieval'
import { generateRFPResponse } from '@/lib/generation'
import { AskRequestSchema } from '@/lib/schema'

export async function POST(request: NextRequest) {
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
    const response = await generateRFPResponse(query, retrievedChunks, rfp_context)

    // Store result
    const retrievedIds = retrievedChunks.map((c) => c.id)
    await supabase.from('query_results').insert({
      query_id: queryRecord.id,
      answer: response,
      retrieved_chunk_ids: retrievedIds,
    })

    return NextResponse.json({
      query_id: queryRecord.id,
      response,
      retrieved_chunks: retrievedChunks,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ask]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
