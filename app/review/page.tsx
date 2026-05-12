import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase-server'
import { ReviewQueue } from '@/components/ReviewQueue'

export default async function ReviewPage() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/error')

  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Review Queue</h1>
        <p className="text-sm text-gray-500">
          Answers assigned to you that need review before being sent to the customer.
        </p>
      </div>
      <ReviewQueue />
    </div>
  )
}
