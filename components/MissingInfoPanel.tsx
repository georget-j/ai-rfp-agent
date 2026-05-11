import type { MissingInfo } from '@/lib/schema'

const OWNER_LABELS: Record<MissingInfo['suggested_owner'], string> = {
  product: 'Product',
  engineering: 'Engineering',
  commercial: 'Commercial',
  legal: 'Legal',
  customer: 'Customer',
  unknown: 'Unknown',
}

interface MissingInfoPanelProps {
  items: MissingInfo[]
}

export function MissingInfoPanel({ items }: MissingInfoPanelProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border-l-2 border-amber-300 pl-3">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-gray-800">{item.item}</p>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              → {OWNER_LABELS[item.suggested_owner]}
            </span>
          </div>
          <p className="text-xs text-gray-500">{item.why_it_matters}</p>
        </div>
      ))}
    </div>
  )
}
