import { parse } from 'csv-parse/sync'
import type { ExtractionResult } from '../types/ingestion'

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  const blocks = records.map((row) =>
    Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  ')
  )

  const text = blocks.join('\n')
  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings: [], wordCount }
}
