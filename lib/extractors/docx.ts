import mammoth from 'mammoth'
import type { ExtractionResult } from '../types/ingestion'

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer })
  const text = result.value.trim()
  const warnings: string[] = []

  for (const msg of result.messages) {
    if (msg.type === 'warning') {
      warnings.push(msg.message)
    }
  }

  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings, wordCount }
}
