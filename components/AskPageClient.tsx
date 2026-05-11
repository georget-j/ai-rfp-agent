'use client'

import { useSearchParams } from 'next/navigation'
import { QueryForm } from './QueryForm'

export function AskPageClient() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  return <QueryForm initialQuery={initialQuery} />
}
