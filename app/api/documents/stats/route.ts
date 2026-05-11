import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export type DocumentStats = {
  total_documents: number
  total_chunks: number
  by_type: { ext: string; count: number }[]
}

export async function GET() {
  try {
    const supabase = getServiceSupabase()

    const [{ data: docs, error: docsError }, { count: chunkCount, error: chunksError }] =
      await Promise.all([
        supabase.from('documents').select('file_name'),
        supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
      ])

    if (docsError) throw new Error(docsError.message)
    if (chunksError) throw new Error(chunksError.message)

    const extCounts: Record<string, number> = {}
    for (const doc of docs ?? []) {
      const ext = doc.file_name
        ? (doc.file_name.split('.').pop()?.toLowerCase() ?? 'other')
        : 'other'
      extCounts[ext] = (extCounts[ext] ?? 0) + 1
    }

    const by_type = Object.entries(extCounts)
      .map(([ext, count]) => ({ ext, count }))
      .sort((a, b) => b.count - a.count)

    const stats: DocumentStats = {
      total_documents: docs?.length ?? 0,
      total_chunks: chunkCount ?? 0,
      by_type,
    }

    return NextResponse.json(stats)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
