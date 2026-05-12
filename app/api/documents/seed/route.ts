import { NextRequest, NextResponse } from 'next/server'
import { seedSampleDocuments } from '@/lib/sample-data'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'seed')
  if (limited) return limited

  try {
    const result = await seedSampleDocuments()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[seed]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
