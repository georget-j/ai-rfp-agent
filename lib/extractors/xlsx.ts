import * as XLSX from 'xlsx'
import type { ExtractionResult } from '../types/ingestion'

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const blocks = rows.map((row) =>
    Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  ')
  )

  const text = blocks.join('\n')
  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings: [], wordCount }
}
