import { RFPHistoryList } from '@/components/RFPHistoryList'
import Link from 'next/link'

export default function RFPHistoryPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-gray-900">RFP History</h1>
          <Link
            href="/rfp"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← New RFP
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Past RFP processing runs. Expand any run to review answers by section or re-export as Word.
        </p>
      </div>
      <RFPHistoryList />
    </div>
  )
}
