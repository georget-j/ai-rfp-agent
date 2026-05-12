import { ReviewQueue } from '@/components/ReviewQueue'

export default function ReviewPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Review Queue</h1>
        <p className="text-sm text-gray-500">
          Answers that need review before being sent to the customer.
        </p>
      </div>
      <ReviewQueue />
    </div>
  )
}
