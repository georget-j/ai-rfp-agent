import Link from 'next/link'
import { RFPProcessor } from '@/components/RFPProcessor'

export default function RFPPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-head">
        <div className="title-block">
          <div className="eyebrow" style={{ marginBottom: 6 }}>RFP Runs</div>
          <h1>RFP document <em>processor</em></h1>
          <p className="subtitle">
            Upload a full RFP document. The agent will extract every requirement and draft a
            grounded response for each one — sourced from your knowledge base.
          </p>
        </div>
        <div className="actions">
          <Link href="/rfp/history" className="btn ghost sm">View history →</Link>
        </div>
      </div>
      <RFPProcessor />
    </div>
  )
}
