import type { ExtractionResult } from '../types/ingestion'

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8').trim()
  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings: [], wordCount }
}
