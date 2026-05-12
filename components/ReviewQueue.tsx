'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type ReviewItem = {
  id: string
  query_id: string
  rfp_run_id: string | null
  topic: string
  risk_level: string
  confidence_score: number | null
  assigned_to: string
  status: string
  due_at: string | null
  created_at: string
  queries: {
    query_text: string
    rfp_context: Record<string, unknown> | null
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

const RISK_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-green-50 text-green-700 border-green-200',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  assigned: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  escalated: 'bg-purple-50 text-purple-700',
}

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

function confLabel(score: number | null): string {
  if (score === null) return '—'
  const pct = Math.round(score * 100)
  if (score >= 0.75) return `${pct}%`
  if (score >= 0.60) return `${pct}%`
  return `${pct}%`
}

function confColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 0.75) return 'text-green-600'
  if (score >= 0.60) return 'text-amber-600'
  return 'text-red-600'
}

export function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FilterTab>('pending')

  useEffect(() => {
    fetch('/api/review/queue')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data)
        else setError(data.error ?? 'Failed to load')
      })
      .catch(() => setError('Failed to load review queue'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((item) => {
    if (tab === 'all') return true
    if (tab === 'pending') return item.status === 'pending' || item.status === 'assigned'
    return item.status === tab
  })

  const counts = {
    pending: items.filter((i) => i.status === 'pending' || i.status === 'assigned').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
    all: items.length,
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-6">Loading review queue…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600 py-6">{error}</p>
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'approved', label: `Approved (${counts.approved})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
    { key: 'all', label: `All (${counts.all})` },
  ]

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No items in this tab.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {filtered.map((item) => {
            const rfpTitle =
              (item.queries?.rfp_context?.rfp_title as string) ?? 'Untitled RFP'
            const questionText = item.queries?.query_text ?? ''
            const isOverdue = item.due_at && new Date(item.due_at) < new Date()

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{rfpTitle}</p>
                  <p className="text-sm text-gray-900 truncate">{questionText}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {TOPIC_LABEL[item.topic] ?? item.topic}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded border',
                        RISK_STYLES[item.risk_level] ?? 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {item.risk_level} risk
                    </span>
                    <span className={cn('text-xs font-medium', confColor(item.confidence_score))}>
                      {confLabel(item.confidence_score)} confidence
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isOverdue && (
                    <span className="text-xs text-red-500 font-medium">Overdue</span>
                  )}
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {item.status}
                  </span>
                  {(item.status === 'pending' || item.status === 'assigned') && (
                    <Link
                      href={`/review/${item.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Review →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
