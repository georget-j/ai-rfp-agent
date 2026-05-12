import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { escalateOverdueReviews } from '@/lib/review-routing'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('review_requests')
    .select(`
      id, query_id, rfp_run_id, topic, risk_level, confidence_score,
      assigned_to, status, due_at, notified_at, created_at, updated_at,
      queries(query_text, rfp_context)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void escalateOverdueReviews().catch((err) =>
    console.warn('[queue] escalation error:', err),
  )

  return NextResponse.json(data ?? [])
}
