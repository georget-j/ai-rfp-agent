'use client'

import { useState, useEffect } from 'react'
import { formatDate, truncate } from '@/lib/utils'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import { ErrorAlert } from './ErrorAlert'
import type { RFPRunSummary } from '@/app/api/rfp/runs/route'
import type { RFPRunDetail, RFPRunQuestion } from '@/app/api/rfp/runs/[id]/route'
import type { BatchItem } from '@/lib/export-docx'

// ── Confidence distribution bar ───────────────────────────────────────────────

function ConfBar({ dist, total }: { dist: RFPRunSummary['confidence_distribution']; total: number }) {
  if (total === 0) return <span className="text-xs text-gray-400">—</span>
  const pct = (n: number) => Math.round((n / total) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-1.5 w-24 rounded-full overflow-hidden bg-gray-100">
        {dist.high > 0 && (
          <div className="bg-green-500 h-full" style={{ width: `${pct(dist.high)}%` }} />
        )}
        {dist.medium > 0 && (
          <div className="bg-amber-400 h-full" style={{ width: `${pct(dist.medium)}%` }} />
        )}
        {dist.low > 0 && (
          <div className="bg-red-400 h-full" style={{ width: `${pct(dist.low)}%` }} />
        )}
      </div>
      <span className="text-[10px] text-gray-400">
        {dist.high}H · {dist.medium}M · {dist.low}L
      </span>
    </div>
  )
}

// ── Expanded run detail ───────────────────────────────────────────────────────

function ExpandedRun({ runId, onClose }: { runId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<RFPRunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/rfp/runs/${runId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setDetail(data as RFPRunDetail)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [runId])

  async function handleExport() {
    if (!detail) return
    const items: BatchItem[] = detail.questions
      .filter((q): q is RFPRunQuestion & { response: NonNullable<RFPRunQuestion['response']> } =>
        q.response !== null,
      )
      .map((q) => ({
        section: q.section,
        question: q.query_text,
        response: q.response,
      }))

    if (items.length === 0) return
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch('/api/export/rfp-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfpTitle: detail.rfp_title, items }),
      })
      if (!res.ok) {
        const msg = await res.text().then((t) => { try { return JSON.parse(t).error } catch { return null } })
        throw new Error(msg ?? `Export failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${detail.rfp_title || 'rfp'}-responses.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Group questions by section
  const sectionGroups = detail
    ? detail.questions.reduce<Record<string, RFPRunQuestion[]>>((acc, q) => {
        const arr = acc[q.section] ?? []
        arr.push(q)
        acc[q.section] = arr
        return acc
      }, {})
    : {}

  return (
    <tr>
      <td colSpan={5} className="bg-gray-50 border-t border-gray-200 px-4 py-4">
        {loading && <LoadingState message="Loading run…" />}
        {error && <ErrorAlert message={error} onDismiss={onClose} />}
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {detail.questions.length} question{detail.questions.length !== 1 ? 's' : ''}
                </span>
                {exportError && (
                  <span className="text-xs text-red-500">{exportError}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {exporting ? 'Exporting…' : '⬇ Export as Word'}
                </button>
                <button
                  onClick={onClose}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {Object.entries(sectionGroups).map(([section, questions]) => (
              <div key={section} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {section}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  {questions.map((q) => (
                    <div key={q.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">{q.query_text}</p>
                        {q.executive_summary && (
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            {truncate(q.executive_summary, 200)}
                          </p>
                        )}
                      </div>
                      {q.confidence_level && (
                        <div className="shrink-0">
                          <ConfidenceBadge
                            confidence={{ level: q.confidence_level, reason: '' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────

export function RFPHistoryList() {
  const [runs, setRuns] = useState<RFPRunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/rfp/runs')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setRuns(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState message="Loading RFP history…" />
  if (error) return <ErrorAlert message={error} onDismiss={() => setError(null)} />

  if (runs.length === 0) {
    return (
      <EmptyState
        title="No RFP runs yet"
        description="Process an RFP document on the RFP page and runs will appear here."
      />
    )
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Questions
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Confidence
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Date
            </th>
            <th className="px-4 py-3 w-20" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {runs.map((run) => (
            <>
              <tr
                key={run.run_id}
                className={`transition-colors ${expandedId === run.run_id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {truncate(run.rfp_title, 80)}
                  </p>
                  {run.answered_count < run.question_count && (
                    <p className="text-xs text-amber-500 mt-0.5">
                      {run.answered_count} of {run.question_count} answered
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-sm text-gray-700">{run.question_count}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <ConfBar dist={run.confidence_distribution} total={run.answered_count} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-400 hidden md:table-cell">
                  {formatDate(run.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setExpandedId((prev) => (prev === run.run_id ? null : run.run_id))
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {expandedId === run.run_id ? 'Hide ▲' : 'View ▼'}
                  </button>
                </td>
              </tr>
              {expandedId === run.run_id && (
                <ExpandedRun
                  key={`expanded-${run.run_id}`}
                  runId={run.run_id}
                  onClose={() => setExpandedId(null)}
                />
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
