import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase-server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('review_requests')
    .select(`
      id, query_id, rfp_run_id, topic, risk_level, confidence_score,
      assigned_to, status, due_at, notified_at, created_at, updated_at,
      queries(query_text, rfp_context)
    `)
    .eq('assigned_to', user.email)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
