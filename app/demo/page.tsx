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
    <div style={{ maxWidth: 900 }}>
      <div className="page-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div className="eyebrow">Demo Scenarios</div>
        <h1>Preloaded <em>scenarios</em></h1>
        <p className="subtitle">
          Representative RFP questions that test retrieval accuracy, source grounding, and missing information flagging.
        </p>
      </div>

      <div className="badge warn" style={{ marginBottom: 28, display: 'inline-flex' }}>
        Load the sample dataset from the Dashboard before running these scenarios.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <h3>{scenario.title}</h3>
              <span className="badge mono">{scenario.industry}</span>
            </div>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{scenario.description}</p>
            </div>
            <div>
              {scenario.questions.map((q, i) => {
                const params = new URLSearchParams({ q: q.query })
                if (q.context) {
                  Object.entries(q.context).forEach(([k, v]) => params.set(k, v))
                }
                return (
                  <div key={i} style={{ padding: '14px 18px', borderBottom: i < scenario.questions.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{q.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {q.query}
                      </p>
                    </div>
                    <Link href={`/ask?${params.toString()}`} className="btn sm" style={{ flexShrink: 0 }}>
                      Ask →
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 28, background: 'var(--bg)' }}>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink)' }}>Evaluation note:</strong> The off-topic test in the Enterprise Security scenario
          (hospital staffing) is designed to verify that the agent returns a low-confidence response and flags missing information
          rather than generating a hallucinated answer. This is a key correctness check for production deployments.
        </p>
      </div>
    </div>
  )
}
