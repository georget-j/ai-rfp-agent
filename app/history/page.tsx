import { HistoryList } from '@/components/HistoryList'

export default function HistoryPage() {
  return (
    <div>
      <div className="page-head">
        <div className="title-block">
          <div className="eyebrow" style={{ marginBottom: 6 }}>History</div>
          <h1>Past <em>queries</em></h1>
          <p className="subtitle">
            Your past queries and generated responses. Click any row to expand the full response.
          </p>
        </div>
      </div>
      <HistoryList />
    </div>
  )
}
