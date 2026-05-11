import type { ExtractionResult } from '../types/ingestion'

const MAX_KEYS = 500

function countKeys(obj: unknown, depth = 0): number {
  if (depth > 10 || typeof obj !== 'object' || obj === null) return 0
  const keys = Object.keys(obj as Record<string, unknown>)
  return keys.length + keys.reduce((acc, k) => acc + countKeys((obj as Record<string, unknown>)[k], depth + 1), 0)
}

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const raw = buffer.toString('utf-8')
  const parsed = JSON.parse(raw)

  const totalKeys = countKeys(parsed)
  const warnings: string[] = []

  if (totalKeys > MAX_KEYS) {
    warnings.push(
      `This JSON file is large (${totalKeys} total keys). Only a text representation has been indexed — ` +
      'deep nesting or arrays with many objects may reduce retrieval precision.'
    )
  }

  const text = JSON.stringify(parsed, null, 2)
  const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings, wordCount }
}
