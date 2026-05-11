import Link from 'next/link'
import { SampleDataLoader } from '@/components/SampleDataLoader'
import { getServiceSupabase } from '@/lib/supabase'
import { fileBadge, EXT_CLASSES } from '@/lib/file-type'

async function getKnowledgeBaseStats() {
  try {
    const supabase = getServiceSupabase()

    const [{ data: docs, error: docsError }, { count: chunkCount, error: chunksError }] =
      await Promise.all([
        supabase.from('documents').select('file_name'),
        supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
      ])

    if (docsError || chunksError) return null

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

    return {
      total_documents: docs?.length ?? 0,
      total_chunks: chunkCount ?? 0,
      by_type,
    }
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stats = await getKnowledgeBaseStats()
  const docCount = stats?.total_documents ?? null

  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          AI RFP / Enterprise Knowledge Agent
        </h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Draft RFP responses grounded in your internal knowledge base.
          Upload documents, ask questions, and get structured answers with source citations,
          evidence assessment, and missing information flags.
        </p>
      </div>

      {/* Knowledge base stats */}
      {stats && stats.total_documents > 0 && (
        <div className="mb-8 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Knowledge base</h2>
            <Link href="/documents" className="text-xs text-blue-600 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_documents}</p>
              <p className="text-xs text-gray-500">document{stats.total_documents !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_chunks.toLocaleString()}</p>
              <p className="text-xs text-gray-500">chunks indexed</p>
            </div>
          </div>
          {stats.by_type.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stats.by_type.map(({ ext, count }) => {
                const badge = fileBadge(`file.${ext}`) ?? {
                  label: ext.toUpperCase(),
                  className: 'bg-gray-100 text-gray-600',
                }
                return (
                  <span
                    key={ext}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                    <span className="opacity-60">{count}</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state status */}
      {docCount !== null && docCount === 0 && (
        <div className="mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="text-sm text-gray-600">No documents indexed yet</span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        <SampleDataLoader />

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Upload Your Own</h3>
          <p className="text-xs text-gray-500 mb-3">
            Upload PDF, DOCX, CSV, XLSX, HTML, JSON, Markdown, or plain text files.
          </p>
          <Link
            href="/documents"
            className="inline-flex px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Upload Documents
          </Link>
        </div>
      </div>

      {/* Workflow */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Ingest documents',
              desc: 'Upload capability statements, case studies, security notes, and implementation guides.',
            },
            {
              step: '2',
              title: 'Ask a question',
              desc: 'Type an RFP question or proposal requirement in plain language.',
            },
            {
              step: '3',
              title: 'Get a structured response',
              desc: 'Receive a draft answer with citations, confidence level, and flagged gaps.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <div className="mt-8 flex gap-3 flex-wrap">
        <Link
          href="/ask"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Ask a question
        </Link>
        <Link
          href="/demo"
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          View demo scenarios
        </Link>
        <Link
          href="/documents"
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Manage documents
        </Link>
      </div>
    </div>
  )
}
