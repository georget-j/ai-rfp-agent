import { getServiceSupabase } from './supabase'

export async function logReviewAction(
  reviewRequestId: string,
  actorEmail: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const supabase = getServiceSupabase()
  await supabase.from('review_audit_log').insert({
    review_request_id: reviewRequestId,
    actor_email: actorEmail,
    action,
    details: details ?? null,
  })
}
