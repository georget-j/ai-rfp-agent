import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getServiceSupabase()

  const [reviewResult, auditResult] = await Promise.all([
    supabase
      .from('review_requests')
      .select(`
        id, query_id, rfp_run_id, topic, risk_level, confidence_score,
        assigned_to, status, due_at, notified_at, created_at, updated_at,
        queries(query_text, rfp_context, query_results(answer, retrieved_chunk_ids, created_at))
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('review_audit_log')
      .select('id, actor_email, action, details, created_at')
      .eq('review_request_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (reviewResult.error || !reviewResult.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...reviewResult.data,
    audit_log: auditResult.data ?? [],
  })
}
