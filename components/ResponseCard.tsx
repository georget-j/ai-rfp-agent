'use client'

import { useState } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EvidencePanel } from './EvidencePanel'
import { CitationCard } from './CitationCard'
import { MissingInfoPanel } from './MissingInfoPanel'
import { SuggestedActionsList } from './SuggestedActionsList'
import type { AskResponse } from '@/lib/schema'

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
      {title}
    </h3>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <SectionHeader title={title} />
      {children}
    </div>
  )
}

interface ResponseCardProps {
  result: AskResponse
}

export function ResponseCard({ result }: ResponseCardProps) {
  const { response, retrieved_chunks } = result
  const [copied, setCopied] = useState(false)

  const chunkMap = Object.fromEntries(retrieved_chunks.map((c) => [c.id, c]))

  function buildMarkdown() {
    const citations = response.citations
      .map((c) => `- **${c.source_title}**: "${c.excerpt}"`)
      .join('\n')
    return `## RFP Response\n\n${response.draft_answer}\n\n## Sources\n\n${citations}`
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SectionHeader title="Draft RFP Response" />
          <ConfidenceBadge confidence={response.confidence} />
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1 rounded transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy as markdown'}
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Executive Summary */}
        <div>
          <SectionHeader title="Executive Summary" />
          <p className="text-sm text-gray-600 leading-relaxed">{response.executive_summary}</p>
        </div>

        {/* Draft Answer */}
        <Section title="Full Response">
          <div className="prose prose-sm max-w-none text-gray-800">
            {response.draft_answer.split('\n\n').map((para, i) => (
              <p key={i} className="mb-3 last:mb-0 text-sm leading-relaxed">{para}</p>
            ))}
          </div>
        </Section>

        {/* Confidence */}
        <Section title="Confidence Assessment">
          <ConfidenceBadge confidence={response.confidence} showReason />
        </Section>

        {/* Supporting Evidence */}
        {response.supporting_evidence.length > 0 && (
          <Section title="Supporting Evidence">
            <EvidencePanel evidence={response.supporting_evidence} />
          </Section>
        )}

        {/* Citations */}
        {response.citations.length > 0 && (
          <Section title={`Source Citations (${response.citations.length})`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {response.citations.map((citation) => (
                <CitationCard
                  key={citation.chunk_id}
                  citation={citation}
                  chunk={chunkMap[citation.chunk_id]}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Missing Information */}
        {response.missing_information.length > 0 && (
          <Section title={`Missing Information (${response.missing_information.length})`}>
            <MissingInfoPanel items={response.missing_information} />
          </Section>
        )}

        {/* Suggested Next Actions */}
        {response.suggested_next_actions.length > 0 && (
          <Section title="Suggested Next Actions">
            <SuggestedActionsList actions={response.suggested_next_actions} />
          </Section>
        )}
      </div>
    </div>
  )
}
