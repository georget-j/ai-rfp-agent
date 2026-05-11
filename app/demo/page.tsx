import Link from 'next/link'

type Scenario = {
  id: string
  title: string
  description: string
  industry: string
  questions: { label: string; query: string; context?: Record<string, string> }[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'fintech-aml',
    title: 'Fintech AML RFP',
    description: 'A digital bank is evaluating AI vendors to improve their AML compliance process. They want evidence of past success, implementation approach, and security posture.',
    industry: 'Fintech',
    questions: [
      {
        label: 'Reduction in AML review time',
        query: 'Draft a response to a fintech customer asking how we reduce AML review time. Include quantified evidence if available.',
        context: { industry: 'fintech', response_type: 'case-study' },
      },
      {
        label: 'Security and data handling',
        query: 'The customer is a regulated financial institution asking about our data handling and security certifications. What can we tell them?',
        context: { industry: 'fintech', response_type: 'security-compliance' },
      },
      {
        label: 'Implementation timeline',
        query: 'What is our standard implementation timeline and what do we need from the customer team?',
        context: { industry: 'fintech', response_type: 'implementation-approach' },
      },
    ],
  },
  {
    id: 'legaltech',
    title: 'Legaltech Contract Review',
    description: 'A law firm wants to reduce the time associates spend on first-pass contract review. They are evaluating AI tools for clause extraction and playbook comparison.',
    industry: 'Legaltech',
    questions: [
      {
        label: 'Contract review case study',
        query: 'Which case studies are relevant to a legaltech workflow automation pitch for contract review?',
        context: { industry: 'legaltech', response_type: 'case-study' },
      },
      {
        label: 'First-pass review time reduction',
        query: 'What evidence do we have that our platform reduces first-pass contract review time?',
        context: { industry: 'legaltech' },
      },
      {
        label: 'Human-in-the-loop',
        query: 'The law firm wants to understand how we maintain human oversight and accountability when using AI for legal document review.',
        context: { industry: 'legaltech', response_type: 'technical-answer' },
      },
    ],
  },
  {
    id: 'enterprise-security',
    title: 'Enterprise Security Due Diligence',
    description: 'An enterprise buyer\'s infosec team is reviewing the platform before procurement approval. They want specifics on certifications, data handling, and access controls.',
    industry: 'Enterprise SaaS',
    questions: [
      {
        label: 'SOC 2 and certifications',
        query: 'Do we have SOC 2 certification? What security certifications do we hold?',
        context: { response_type: 'security-compliance' },
      },
      {
        label: 'Data isolation and residency',
        query: 'The customer wants to know how we isolate their data and whether they can choose data residency.',
        context: { response_type: 'security-compliance' },
      },
      {
        label: 'Off-topic test — hallucination check',
        query: 'Can this platform help with hospital staffing optimisation and NHS workforce planning?',
      },
    ],
  },
]

export default function DemoPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Demo Scenarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Preloaded scenarios for demonstrations. Each includes representative RFP questions
          that test the agent&apos;s retrieval accuracy, source grounding, and missing information flagging.
        </p>
        <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 inline-block">
          Load the sample dataset from the Dashboard before running these scenarios.
        </p>
      </div>

      <div className="space-y-8">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-gray-900">{scenario.title}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {scenario.industry}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{scenario.description}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {scenario.questions.map((q, i) => {
                const params = new URLSearchParams({ q: q.query })
                if (q.context) {
                  Object.entries(q.context).forEach(([k, v]) => params.set(k, v))
                }
                return (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{q.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                        {q.query}
                      </p>
                    </div>
                    <Link
                      href={`/ask?${params.toString()}`}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Ask →
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong className="text-gray-800">Evaluation note:</strong> The off-topic test in the Enterprise Security scenario
          (hospital staffing) is designed to verify that the agent returns a low-confidence response and flags missing information
          rather than generating a hallucinated answer. This is a key correctness check for production deployments.
        </p>
      </div>
    </div>
  )
}
