import { parse } from 'node-html-parser'
import type { ExtractionResult } from '../types/ingestion'

const NOISE_TAGS = ['script', 'style', 'nav', 'footer', 'head', 'noscript', 'iframe']

export async function extract(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const root = parse(buffer.toString('utf-8'))

  for (const tag of NOISE_TAGS) {
    root.querySelectorAll(tag).forEach((el) => el.remove())
  }

  const text = root.text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Prefer <title> tag as document title
  const titleTag = parse(buffer.toString('utf-8')).querySelector('title')
  const title = titleTag?.text?.trim() || fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

  const wordCount = text.split(/\s+/).filter(Boolean).length
  return { text, title, warnings: [], wordCount }
}
