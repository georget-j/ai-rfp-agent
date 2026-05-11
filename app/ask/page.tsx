import { Suspense } from 'react'
import { AskPageClient } from '@/components/AskPageClient'
import { LoadingState } from '@/components/LoadingState'

const EXAMPLE_QUESTIONS = [
  'Draft a response to a fintech customer asking how we reduce AML review time.',
  'Do we have SOC 2 certification? What is our security compliance status?',
  'Which case studies are relevant to a legaltech workflow automation pitch?',
  'Describe our standard implementation timeline and what we need from the customer.',
  'What evidence do we have that our platform reduces manual review time?',
  'Generate a response to an RFP question about our AI and human oversight approach.',
]

export default function AskPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Ask</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask an RFP question or proposal requirement. The agent searches your knowledge base
          and generates a structured, cited response.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingState />}>
            <AskPageClient />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Example questions
          </h2>
          <ul className="space-y-2">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <li key={i}>
                <a
                  href={`/ask?q=${encodeURIComponent(q)}`}
                  className="block text-xs text-gray-600 hover:text-gray-900 leading-relaxed p-2.5 rounded border border-transparent hover:border-gray-200 hover:bg-white transition-all"
                >
                  {q}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
