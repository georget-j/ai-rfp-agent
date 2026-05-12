'use client'

import { useState } from 'react'
import { ErrorAlert } from './ErrorAlert'
import { ResponseCard } from './ResponseCard'
import type { AskResponse, PartialRFPResponse, RFPContext, RetrievedChunk } from '@/lib/schema'

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

type Phase = 'idle' | 'retrieving' | 'generating' | 'done'

interface QueryFormProps {
  initialQuery?: string
  initialContext?: Partial<RFPContext>
  autoSubmit?: boolean
}

export function QueryForm({ initialQuery = '', initialContext = {} }: QueryFormProps) {
  const [query, setQuery] = useState(initialQuery)
  const [industry, setIndustry] = useState(initialContext.industry ?? '')
  const [responseType, setResponseType] = useState(initialContext.response_type ?? '')
  const [tone, setTone] = useState(initialContext.tone ?? '')
  const [showContext, setShowContext] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [queryId, setQueryId] = useState<string | null>(null)
  const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>([])
  const [partial, setPartial] = useState<PartialRFPResponse | null>(null)
  const [result, setResult] = useState<AskResponse | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setPhase('retrieving')
    setError(null)
    setResult(null)
    setPartial(null)
    setQueryId(null)
    setRetrievedChunks([])

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

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let latestPartial: PartialRFPResponse | null = null
      let latestQueryId: string | null = null
      let latestChunks: RetrievedChunk[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''

        for (const msg of messages) {
          if (!msg.startsWith('data: ')) continue
          const event = JSON.parse(msg.slice(6))

          if (event.type === 'meta') {
            latestQueryId = event.query_id
            latestChunks = event.retrieved_chunks
            setQueryId(event.query_id)
            setRetrievedChunks(event.retrieved_chunks)
            setPhase('generating')
          } else if (event.type === 'partial') {
            latestPartial = event.object
            setPartial(event.object)
          } else if (event.type === 'done') {
            if (latestPartial && latestQueryId) {
              setResult({
                query_id: latestQueryId,
                response: latestPartial as AskResponse['response'],
                retrieved_chunks: latestChunks,
                unverified_citations_removed: event.removed_citations ?? 0,
              })
            }
            setPhase('done')
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('idle')
    }
  }

  const isLoading = phase === 'retrieving' || phase === 'generating'

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
          disabled={isLoading || !query.trim()}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
              <span>{phase === 'retrieving' ? 'Searching knowledge base…' : 'Generating response…'}</span>
            </>
          ) : (
            'Generate RFP Response'
          )}
        </button>
      </form>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Streaming / completed response */}
      {(partial || result) && (
        <ResponseCard
          result={result ?? undefined}
          partial={result ? undefined : (partial ?? undefined)}
          retrievedChunks={retrievedChunks}
          isStreaming={phase === 'generating'}
          query={query}
        />
      )}
    </div>
  )
}
