import Link from 'next/link'
import { SampleDataLoader } from '@/components/SampleDataLoader'
import { getServiceSupabase } from '@/lib/supabase'

async function getDocumentCount() {
  try {
    const supabase = getServiceSupabase()
    const { count } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
    return count ?? 0
  } catch {
    return null
  }
}

export default async function HomePage() {
  const docCount = await getDocumentCount()

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

      {/* Status */}
      {docCount !== null && (
        <div className="mb-6 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${docCount > 0 ? 'bg-green-400' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">
            {docCount > 0
              ? `${docCount} document${docCount !== 1 ? 's' : ''} indexed`
              : 'No documents indexed yet'}
          </span>
          {docCount > 0 && (
            <Link href="/ask" className="text-sm text-blue-600 hover:underline ml-1">
              Ask a question →
            </Link>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        <SampleDataLoader />

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Upload Your Own</h3>
          <p className="text-xs text-gray-500 mb-3">
            Upload .txt or .md files to add your own documents to the knowledge base.
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
