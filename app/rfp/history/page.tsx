import { RFPHistoryList } from '@/components/RFPHistoryList'
import Link from 'next/link'

export default function RFPHistoryPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-head">
        <div className="title-block">
          <div className="eyebrow" style={{ marginBottom: 6 }}>RFP Runs</div>
          <h1>Run <em>history</em></h1>
          <p className="subtitle">
            Past RFP processing runs. Expand any run to review answers by section or re-export as Word.
          </p>
        </div>
        <div className="actions">
          <Link href="/rfp" className="btn ghost sm">← New RFP</Link>
        </div>
      </div>
      <RFPHistoryList />
    </div>
  )
}
