import type { RFPResponse } from './schema'
import { computeConfidenceScore, shouldRoute } from './confidence-score'
import { getRoutingConfig, createReviewRequest } from './routing'
import { dispatchReviewNotification } from './notifications'
import { getServiceSupabase } from './supabase'

type AnsweredItem = {
  queryId: string
  questionText: string
  section: string
  topic: string
  riskLevel: string
  response: RFPResponse
}

export async function routeAnswersForReview(
  items: AnsweredItem[],
  rfpRunId: string | undefined,
  rfpTitle: string,
): Promise<void> {
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
    })
    if (!reviewRequest) continue

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
}
