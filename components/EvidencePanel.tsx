import { cn } from '@/lib/utils'
import type { SupportingEvidence } from '@/lib/schema'

const STRENGTH_STYLES = {
  strong: 'bg-green-50 border-green-200 text-green-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  weak: 'bg-gray-50 border-gray-200 text-gray-600',
}

interface EvidencePanelProps {
  evidence: SupportingEvidence[]
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  if (evidence.length === 0) return null

  return (
    <div className="space-y-2">
      {evidence.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className={cn(
            'mt-0.5 shrink-0 border rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            STRENGTH_STYLES[item.strength]
          )}>
            {item.strength}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">{item.claim}</p>
        </div>
      ))}
    </div>
  )
}
