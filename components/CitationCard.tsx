import { truncate, similarityToPercent } from '@/lib/utils'
import type { Citation, RetrievedChunk } from '@/lib/schema'

interface CitationCardProps {
  citation: Citation
  chunk?: RetrievedChunk
}

export function CitationCard({ citation, chunk }: CitationCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-700">{citation.source_title}</span>
        {chunk && (
          <span className="text-xs text-gray-400 shrink-0">
            {similarityToPercent(chunk.similarity)}% match
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 italic mb-2 leading-relaxed">
        &ldquo;{truncate(citation.excerpt, 220)}&rdquo;
      </p>
      <p className="text-xs text-gray-500">{citation.relevance}</p>
    </div>
  )
}
