'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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

const TOPIC_LABEL: Record<string, string> = {
  security_compliance: 'Security & Compliance',
  legal: 'Legal',
  pricing: 'Pricing',
  technical: 'Technical',
  commercial: 'Commercial',
  implementation: 'Implementation',
  support: 'Support',
  general: 'General',
}

export function ReviewCard({ review }: { review: ReviewRequest }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editedAnswer, setEditedAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const answer = review.queries?.query_results?.[0]?.answer
  const questionText = review.queries?.query_text ?? ''
  const rfpTitle = (review.queries?.rfp_context?.rfp_title as string) ?? 'Untitled RFP'
  const draftAnswer = answer?.draft_answer ?? ''

  async function submit(action: 'approve' | 'reject') {
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch(`/api/review/${review.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          edited_answer: editing && editedAnswer.trim() ? editedAnswer.trim() : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setDone(action === 'approve' ? 'approved' : 'rejected')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-lg font-semibold text-gray-900 mb-1">
          {done === 'approved' ? 'Answer approved' : 'Answer rejected'}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {done === 'approved'
            ? 'The approved answer has been saved and added to the knowledge base.'
            : 'The answer has been marked as rejected.'}
        </p>
        <button
          onClick={() => router.push('/review')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to queue
        </button>
      </div>
    )
  }

  if (review.status === 'approved' || review.status === 'rejected') {
    return (
      <div className="border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500">
          This review has already been <strong>{review.status}</strong>.
        </p>
        <button
          onClick={() => router.push('/review')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to queue
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-blue-500 pl-4 py-1">
        <p className="text-xs text-gray-400 mb-0.5">{rfpTitle}</p>
        <h2 className="text-base font-semibold text-gray-900">{questionText}</h2>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-xs text-gray-500">{TOPIC_LABEL[review.topic] ?? review.topic}</span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded border',
              review.risk_level === 'high'
                ? 'bg-red-50 text-red-700 border-red-200'
                : review.risk_level === 'medium'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-green-50 text-green-700 border-green-200',
            )}
          >
            {review.risk_level} risk
          </span>
          {review.confidence_score !== null && (
            <span
              className={cn(
                'text-xs font-medium',
                review.confidence_score >= 0.75
                  ? 'text-green-600'
                  : review.confidence_score >= 0.60
                  ? 'text-amber-600'
                  : 'text-red-600',
              )}
            >
              {Math.round(review.confidence_score * 100)}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Executive summary */}
      {answer?.executive_summary && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Executive Summary
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{answer.executive_summary}</p>
        </section>
      )}

      {/* Draft answer */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          AI Draft Answer
        </p>
        {editing ? (
          <textarea
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {draftAnswer}
          </div>
        )}
      </section>

      {/* Citations */}
      {answer?.citations && answer.citations.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Citations ({answer.citations.length})
          </p>
          <div className="space-y-2">
            {answer.citations.map((c, i) => (
              <div key={i} className="border-l-2 border-gray-300 pl-3">
                <p className="text-xs font-medium text-gray-700">{c.source_title}</p>
                <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-2">{c.excerpt}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Missing info */}
      {answer?.missing_information && answer.missing_information.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Missing Information ({answer.missing_information.length})
          </p>
          <div className="space-y-1.5">
            {answer.missing_information.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                  {m.suggested_owner}
                </span>
                <p className="text-xs text-gray-700">{m.item}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confidence */}
      {answer?.confidence && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Confidence
          </p>
          <p className="text-sm text-gray-600">{answer.confidence.reason}</p>
        </section>
      )}

      {err && <p className="text-sm text-red-600">{err}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
        {editing ? (
          <>
            <button
              onClick={() => submit('approve')}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Save & Approve'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditedAnswer('') }}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => submit('approve')}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Approve'}
            </button>
            <button
              onClick={() => { setEditing(true); setEditedAnswer(draftAnswer) }}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Edit & Approve
            </button>
            <button
              onClick={() => submit('reject')}
              disabled={submitting}
              className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors"
            >
              {submitting ? '…' : 'Reject'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
