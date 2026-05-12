import type { RFPResponse } from './schema'
import { computeConfidenceScore, shouldRoute } from './confidence-score'
import { getRoutingConfig, createReviewRequest } from './routing'
import { dispatchReviewNotification } from './notifications'
import { getServiceSupabase } from './supabase'
import { logReviewAction } from './audit'

type AnsweredItem = {
  queryId: string
  questionText: string
  section: string
  topic: string
  riskLevel: string
  response: RFPResponse
}

export type RoutingCandidate = {
  queryId: string
  questionText: string
  topic: string
  teamLabel: string
  riskLevel: string
  score: number
}

const TOPIC_LABEL: Record<string, string> = {
  security_compliance: 'Security & Compliance',
  legal: 'Legal',
  pricing: 'Pricing',
  technical: 'Technical',
  engineering: 'Engineering',
  commercial: 'Commercial',
  implementation: 'Implementation',
  support: 'Support',
  general: 'General',
}

export async function computeRoutingCandidates(items: AnsweredItem[]): Promise<RoutingCandidate[]> {
  const candidates: RoutingCandidate[] = []
  for (const item of items) {
    const score = computeConfidenceScore(item.response)
    if (!shouldRoute(score, item.riskLevel)) continue
    const routingConfig = await getRoutingConfig(item.topic)
    if (!routingConfig?.owner_email) continue
    candidates.push({
      queryId: item.queryId,
      questionText: item.questionText,
      topic: item.topic,
      teamLabel: TOPIC_LABEL[item.topic] ?? item.topic,
      riskLevel: item.riskLevel,
      score,
    })
  }
  return candidates
}

export async function escalateOverdueReviews(): Promise<void> {
  const supabase = getServiceSupabase()

  const { data: overdue } = await supabase
    .from('review_requests')
    .select('id, topic, assigned_to, query_id, rfp_run_id, risk_level, confidence_score, status, due_at, notified_at, created_at, updated_at')
    .in('status', ['pending', 'assigned'])
    .lt('due_at', new Date().toISOString())
    .is('backup_notified_at', null)

  if (!overdue?.length) return

  for (const row of overdue) {
    const config = await getRoutingConfig(row.topic)
    if (!config?.backup_email) continue

    const { data: queryData } = await supabase
      .from('queries')
      .select('query_text, rfp_context, query_results(answer)')
      .eq('id', row.query_id)
      .single()

    if (!queryData) continue

    const answer = (queryData.query_results as Array<{ answer: Record<string, unknown> }>)?.[0]?.answer
    const questionText = queryData.query_text
    const executiveSummary = (answer?.executive_summary as string) ?? ''
    const rfpTitle = (queryData.rfp_context as Record<string, unknown> | null)?.rfp_title as string ?? 'Untitled RFP'

    await supabase.from('review_requests').update({
      status: 'escalated',
      backup_notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)

    const escalatedRow = { ...row, assigned_to: config.backup_email }

    dispatchReviewNotification({
      reviewRequest: escalatedRow,
      routingConfig: config,
      questionText,
      executiveSummary,
      rfpTitle,
    }).catch((err) => console.error('[escalation] dispatch error:', err))

    await logReviewAction(row.id, 'system', 'escalated', {
      from: row.assigned_to,
      to: config.backup_email,
    })
  }
}

export async function routeAnswersForReview(
  items: AnsweredItem[],
  rfpRunId: string | undefined,
  rfpTitle: string,
): Promise<number> {
  let routed = 0
  for (const item of items) {
    const score = computeConfidenceScore(item.response)
    if (!shouldRoute(score, item.riskLevel)) continue

    const routingConfig = await getRoutingConfig(item.topic)
    if (!routingConfig || !routingConfig.owner_email) continue

    const reviewRequest = await createReviewRequest({
      queryId: item.queryId,
      rfpRunId,
      topic: item.topic,
      riskLevel: item.riskLevel,
      confidenceScore: score,
      assignedTo: routingConfig.owner_email,
      escalationHours: routingConfig.escalation_hours,
    })
    if (!reviewRequest) continue

    routed++

    // Update notified_at after dispatch
    dispatchReviewNotification({
      reviewRequest,
      routingConfig,
      questionText: item.questionText,
      executiveSummary: item.response.executive_summary,
      rfpTitle,
    })
      .then(async () => {
        const supabase = getServiceSupabase()
        await supabase
          .from('review_requests')
          .update({ notified_at: new Date().toISOString(), status: 'assigned' })
          .eq('id', reviewRequest.id)
      })
      .catch((err) => console.error('[review-routing] dispatch error:', err))
  }
  return routed
}
