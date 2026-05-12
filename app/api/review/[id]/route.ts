import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase-server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getServiceSupabase()

  const { data: reviewRequest, error } = await supabase
    .from('review_requests')
    .select(`
      id, query_id, rfp_run_id, topic, risk_level, confidence_score,
      assigned_to, status, due_at, notified_at, created_at, updated_at,
      queries(query_text, rfp_context, query_results(answer, retrieved_chunk_ids, created_at))
    `)
    .eq('id', id)
    .eq('assigned_to', user.email)
    .single()

  if (error || !reviewRequest) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(reviewRequest)
}
