import type { ExtractionResult } from '../types/ingestion'

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8').trim()

  // Use the first top-level heading as the title if present
  const headingMatch = text.match(/^#\s+(.+)$/m)
  const title = headingMatch
    ? headingMatch[1].trim()
    : fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings: [], wordCount }
}
