import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { RFPResponseSchema } from '@/lib/schema'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { data: queryRow, error: queryError } = await supabase
      .from('queries')
      .select('id, query_text, rfp_context, created_at')
      .eq('id', id)
      .single()

    if (queryError || !queryRow) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    const { data: resultRow, error: resultError } = await supabase
      .from('query_results')
      .select('id, answer, created_at')
      .eq('query_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (resultError || !resultRow) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    const response = RFPResponseSchema.parse(resultRow.answer)

    return NextResponse.json({
      query_id: id,
      query_text: queryRow.query_text,
      created_at: queryRow.created_at,
      response,
      retrieved_chunks: [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
