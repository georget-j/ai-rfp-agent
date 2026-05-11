import * as fs from 'fs'
import * as path from 'path'
import { ingestDocument, documentExists } from './documents'
import type { SeedResult } from './schema'

const SAMPLE_DATA_DIR = path.join(process.cwd(), 'sample-data')

type SampleDoc = {
  fileName: string
  title: string
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  { fileName: 'fintech-aml-case-study.md', title: 'Fintech AML Case Study — Meridian Digital Bank' },
  { fileName: 'legaltech-contract-review.md', title: 'Legaltech Case Study — Contract Review Automation' },
  { fileName: 'enterprise-ai-security-note.md', title: 'Enterprise AI Security & Compliance Overview' },
  { fileName: 'implementation-playbook.md', title: 'Implementation Playbook — Standard Deployment Process' },
  { fileName: 'product-capability-overview.md', title: 'Product Capability Overview' },
  { fileName: 'technical-architecture-note.md', title: 'Technical Architecture Overview' },
  { fileName: 'customer-success-notes.md', title: 'Customer Success Guide — Onboarding & Adoption' },
  { fileName: 'rfp-answer-library.md', title: 'RFP Answer Library — Standard Responses' },
]

export async function seedSampleDocuments(): Promise<SeedResult> {
  const seeded: string[] = []
  const skipped: string[] = []

  for (const doc of SAMPLE_DOCUMENTS) {
    const exists = await documentExists(doc.title)
    if (exists) {
      skipped.push(doc.title)
      continue
    }

    const filePath = path.join(SAMPLE_DATA_DIR, doc.fileName)
    const text = fs.readFileSync(filePath, 'utf-8')

    await ingestDocument({
      text,
      title: doc.title,
      fileName: doc.fileName,
      mimeType: 'text/markdown',
      sourceType: 'sample',
    })

    seeded.push(doc.title)
  }

  return { seeded, skipped }
}
