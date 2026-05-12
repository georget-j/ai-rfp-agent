import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from 'docx'
import type { RFPResponse } from './schema'

export type BatchItem = {
  section: string
  question: string
  response: RFPResponse
  editedDraft?: string
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ text, heading: level })
}

function body(text: string) {
  return new Paragraph({ children: [new TextRun({ text, size: 22 })] })
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22 })],
    indent: { left: 360 },
  })
}

function gap() {
  return new Paragraph({ text: '' })
}

export async function generateDocx(
  query: string,
  response: RFPResponse,
  editedDraft?: string,
): Promise<Buffer> {
  const draft = editedDraft ?? response.draft_answer

  const children = [
    heading('RFP Response', HeadingLevel.HEADING_1),
    gap(),

    heading('Question / Requirement', HeadingLevel.HEADING_2),
    body(query),
    gap(),

    heading('Executive Summary', HeadingLevel.HEADING_2),
    body(response.executive_summary),
    gap(),

    new Paragraph({
      children: [
        new TextRun({ text: 'Confidence: ', bold: true, size: 22 }),
        new TextRun({
          text: `${response.confidence.level.toUpperCase()} — ${response.confidence.reason}`,
          size: 22,
        }),
      ],
    }),
    gap(),

    heading('Full Response', HeadingLevel.HEADING_2),
    ...draft.split('\n\n').map((para) => body(para)),
    gap(),
  ]

  if (response.missing_information.length > 0) {
    children.push(heading('Information Required', HeadingLevel.HEADING_2))
    for (const item of response.missing_information) {
      children.push(
        bullet(`[${item.suggested_owner.toUpperCase()}] ${item.item} — ${item.why_it_matters}`),
      )
    }
    children.push(gap())
  }

  if (response.citations.length > 0) {
    children.push(heading('Source Citations', HeadingLevel.HEADING_2))
    for (const c of response.citations) {
      const excerpt =
        c.excerpt.length > 160 ? c.excerpt.slice(0, 157) + '…' : c.excerpt
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${c.source_title}: `, bold: true, size: 20 }),
            new TextRun({ text: `"${excerpt}"`, italics: true, size: 20, color: '555555' }),
          ],
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
        }),
      )
    }
    children.push(gap())
  }

  if (response.suggested_next_actions.length > 0) {
    children.push(heading('Suggested Next Actions', HeadingLevel.HEADING_2))
    for (const action of response.suggested_next_actions) {
      children.push(bullet(action))
    }
  }

  const doc = new Document({
    sections: [{ children }],
    creator: 'AI RFP Agent',
  })

  return Packer.toBuffer(doc)
}

export async function generateBatchDocx(rfpTitle: string, items: BatchItem[]): Promise<Buffer> {
  const sectionMap = new Map<string, BatchItem[]>()
  for (const item of items) {
    const arr = sectionMap.get(item.section) ?? []
    arr.push(item)
    sectionMap.set(item.section, arr)
  }

  const children: Paragraph[] = [
    heading('RFP Response Document', HeadingLevel.HEADING_1),
    body(rfpTitle),
    gap(),
  ]

  for (const [sectionName, sectionItems] of sectionMap) {
    children.push(heading(sectionName, HeadingLevel.HEADING_2))

    for (const item of sectionItems) {
      const draft = item.editedDraft ?? item.response.draft_answer

      children.push(
        new Paragraph({
          children: [new TextRun({ text: item.question, bold: true, size: 22 })],
        }),
      )
      children.push(body(item.response.executive_summary))
      children.push(gap())

      for (const para of draft.split('\n\n')) {
        children.push(body(para))
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Confidence: ', bold: true, size: 20 }),
            new TextRun({
              text: `${item.response.confidence.level.toUpperCase()} — ${item.response.confidence.reason}`,
              size: 20,
              color: '666666',
            }),
          ],
        }),
      )
      children.push(gap())
    }
  }

  const doc = new Document({ sections: [{ children }], creator: 'AI RFP Agent' })
  return Packer.toBuffer(doc)
}
