import type { ExtractionResult } from '../types/ingestion'
import { extract as extractTxt } from './txt'
import { extract as extractMarkdown } from './markdown'
import { extract as extractPdf } from './pdf'
import { extract as extractDocx } from './docx'
import { extract as extractCsv } from './csv'
import { extract as extractXlsx } from './xlsx'
import { extract as extractHtml } from './html'
import { extract as extractJson } from './json'

const EXTRACTOR_MAP: Record<string, (buf: Buffer, name: string) => Promise<ExtractionResult>> = {
  '.txt':  extractTxt,
  '.md':   extractMarkdown,
  '.pdf':  extractPdf,
  '.docx': extractDocx,
  '.csv':  extractCsv,
  '.xlsx': extractXlsx,
  '.html': extractHtml,
  '.htm':  extractHtml,
  '.json': extractJson,
}

export const ALLOWED_EXTENSIONS = Object.keys(EXTRACTOR_MAP)

export async function extractText(
  buffer: Buffer,
  fileName: string,
  // mimeType is accepted but not used — file extensions are more reliable
  _mimeType?: string
): Promise<ExtractionResult> {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  const extractor = EXTRACTOR_MAP[ext]

  if (!extractor) {
    const result = await extractTxt(buffer, fileName)
    result.warnings.push(
      `Unsupported file type "${ext}" — treated as plain text. Content may not extract cleanly.`
    )
    return result
  }

  return extractor(buffer, fileName)
}
