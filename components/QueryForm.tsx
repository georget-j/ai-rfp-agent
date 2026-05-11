'use client'

import { useState } from 'react'
import { LoadingDots } from './LoadingState'
import { ErrorAlert } from './ErrorAlert'
import { ResponseCard } from './ResponseCard'
import type { AskResponse, RFPContext } from '@/lib/schema'

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Any industry' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'legaltech', label: 'Legaltech' },
  { value: 'enterprise-saas', label: 'Enterprise SaaS' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'industrial', label: 'Industrial / Robotics' },
  { value: 'other', label: 'Other' },
]

const RESPONSE_TYPE_OPTIONS = [
  { value: '', label: 'Any response type' },
  { value: 'executive-summary', label: 'Executive Summary' },
  { value: 'technical-answer', label: 'Technical Answer' },
  { value: 'implementation-approach', label: 'Implementation Approach' },
  { value: 'security-compliance', label: 'Security / Compliance' },
  { value: 'case-study', label: 'Case Study Recommendation' },
  { value: 'full-rfp-draft', label: 'Full RFP Draft' },
]

const TONE_OPTIONS = [
  { value: '', label: 'Default tone' },
  { value: 'concise', label: 'Concise' },
  { value: 'formal', label: 'Formal' },
  { value: 'founder-led', label: 'Founder-led' },
  { value: 'technical', label: 'Technical' },
  { value: 'commercial', label: 'Commercial' },
]

interface QueryFormProps {
  initialQuery?: string
  initialContext?: Partial<RFPContext>
  autoSubmit?: boolean
}

export function QueryForm({ initialQuery = '', initialContext = {}, autoSubmit = false }: QueryFormProps) {
  const [query, setQuery] = useState(initialQuery)
  const [industry, setIndustry] = useState(initialContext.industry ?? '')
  const [responseType, setResponseType] = useState(initialContext.response_type ?? '')
  const [tone, setTone] = useState(initialContext.tone ?? '')
  const [showContext, setShowContext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AskResponse | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    const rfpContext: RFPContext = {}
    if (industry) rfpContext.industry = industry as RFPContext['industry']
    if (responseType) rfpContext.response_type = responseType as RFPContext['response_type']
    if (tone) rfpContext.tone = tone as RFPContext['tone']

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          rfp_context: Object.keys(rfpContext).length > 0 ? rfpContext : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Request failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your question or RFP requirement
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Draft a response to a fintech customer asking how we reduce AML review time…"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Optional RFP context toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowContext(!showContext)}
            className="text-xs text-gray-500 hover:text-gray-800 underline"
          >
            {showContext ? 'Hide context fields' : '+ Add RFP context (optional)'}
          </button>
        </div>

        {showContext && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Response type</label>
              <select
                value={responseType}
                onChange={(e) => setResponseType(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {RESPONSE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {TONE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingDots />
              <span>Searching and generating…</span>
            </>
          ) : (
            'Generate RFP Response'
          )}
        </button>
      </form>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {result && <ResponseCard result={result} />}
    </div>
  )
}
