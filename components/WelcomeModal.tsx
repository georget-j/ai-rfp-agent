'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'rfp_agent_welcomed_v1'

const FEATURES = [
  {
    title: 'Document ingestion',
    desc: 'Upload .txt or .md files, or load the built-in sample dataset. Each document is chunked, embedded, and stored in Postgres.',
  },
  {
    title: 'Markdown-aware chunking',
    desc: 'Documents are split on ## section boundaries so each chunk covers one topic. Every chunk is prefixed with [Document > Section] for a cleaner embedding signal.',
  },
  {
    title: 'Semantic search via pgvector',
    desc: 'Queries are embedded with the same model as the documents, then matched by cosine similarity — no separate vector database needed.',
  },
  {
    title: 'Structured generation',
    desc: 'gpt-4o-mini returns a Zod-validated JSON response covering draft answer, executive summary, evidence, citations, missing info flags, confidence level, and next actions.',
  },
  {
    title: 'Citation verification',
    desc: 'After generation, every cited chunk ID is checked against what was actually retrieved. Citations the model invented are stripped before the response is returned.',
  },
  {
    title: 'Query history',
    desc: 'Every question and its full response is stored. The history page lets you expand any past query, see the RFP context that was used, and re-run it.',
  },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }

    const handler = () => setOpen(true)
    window.addEventListener('show-welcome', handler)
    return () => window.removeEventListener('show-welcome', handler)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI RFP / Enterprise Knowledge Agent</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                A RAG pipeline for drafting enterprise proposal responses grounded in your internal knowledge base — not general AI knowledge.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 shrink-0"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            What's been built
          </p>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Get started */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Get started
          </p>
          <ol className="space-y-1.5 mb-5">
            {[
              'Load the sample dataset from the Dashboard',
              'Go to Ask and type an RFP question',
              'Check History to review and re-run past queries',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Link
              href="/"
              onClick={dismiss}
              className="flex-1 text-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
            <a
              href="https://github.com/georget-j/ai-rfp-agent"
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-white transition-colors"
            >
              View source
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
