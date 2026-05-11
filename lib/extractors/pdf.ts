import pdfParse from 'pdf-parse'
import type { ExtractionResult } from '../types/ingestion'

const MIN_CHARS_PER_PAGE = 100

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const result = await pdfParse(buffer)
  const text = result.text.trim()
  const pageCount = result.numpages
  const warnings: string[] = []

  if (pageCount > 0 && text.length / pageCount < MIN_CHARS_PER_PAGE) {
    warnings.push(
      `This PDF appears to be scanned or image-based (${Math.round(text.length / pageCount)} chars/page). ` +
      'Text quality may be poor — consider using a text-layer PDF or converting to DOCX first.'
    )
  }

  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings, pageCount, wordCount }
}
