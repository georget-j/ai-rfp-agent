import { HistoryList } from '@/components/HistoryList'

export default function HistoryPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your past queries and generated responses. Click any row to expand the full response.
        </p>
      </div>
      <HistoryList />
    </div>
  )
}
