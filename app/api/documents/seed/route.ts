import { NextResponse } from 'next/server'
import { seedSampleDocuments } from '@/lib/sample-data'

export async function POST() {
  try {
    const result = await seedSampleDocuments()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[seed]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
