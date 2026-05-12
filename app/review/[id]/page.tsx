import { notFound } from 'next/navigation'
import { getServiceSupabase } from '@/lib/supabase'
import { ReviewCard } from '@/components/ReviewCard'
import Link from 'next/link'
import type { RFPResponse } from '@/lib/schema'

type ReviewRequest = {
  id: string
  topic: string
  risk_level: string
  confidence_score: number | null
  assigned_to: string
  status: string
  due_at: string | null
  queries: {
    query_text: string
    rfp_context: Record<string, unknown> | null
    query_results: Array<{ answer: RFPResponse }> | null
  } | null
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('review_requests')
    .select(`
      id, topic, risk_level, confidence_score, assigned_to, status, due_at,
      queries(query_text, rfp_context, query_results(answer))
    `)
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-7 flex items-center gap-3">
        <Link href="/review" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          ← Review Queue
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Review Answer</h1>
      </div>
      <ReviewCard review={data as unknown as ReviewRequest} />
    </div>
  )
}
