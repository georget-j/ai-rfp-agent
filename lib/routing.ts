import { getServiceSupabase } from './supabase'

export type RoutingConfig = {
  id: string
  topic: string
  owner_email: string
  backup_email: string | null
  slack_webhook_url: string | null
  preferred_channel: string
  escalation_hours: number
}

export type ReviewRequestRow = {
  id: string
  query_id: string
  rfp_run_id: string | null
  topic: string
  risk_level: string
  confidence_score: number | null
  assigned_to: string
  status: string
  due_at: string | null
  notified_at: string | null
  created_at: string
  updated_at: string
}

export async function getRoutingConfig(topic: string): Promise<RoutingConfig | null> {
  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from('routing_config')
    .select('*')
    .eq('topic', topic)
    .maybeSingle()
  return data ?? null
}

export async function getAllRoutingConfigs(): Promise<RoutingConfig[]> {
  const supabase = getServiceSupabase()
  const { data } = await supabase.from('routing_config').select('*').order('topic')
  return data ?? []
}

export async function createReviewRequest(params: {
  queryId: string
  rfpRunId?: string
  topic: string
  riskLevel: string
  confidenceScore: number
  assignedTo: string
}): Promise<ReviewRequestRow | null> {
  const supabase = getServiceSupabase()

  const dueAt = new Date()
  dueAt.setHours(dueAt.getHours() + 48)

  const { data, error } = await supabase
    .from('review_requests')
    .insert({
      query_id: params.queryId,
      rfp_run_id: params.rfpRunId ?? null,
      topic: params.topic,
      risk_level: params.riskLevel,
      confidence_score: params.confidenceScore,
      assigned_to: params.assignedTo,
      due_at: dueAt.toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('[routing] failed to create review_request:', error.message)
    return null
  }
  return data
}
