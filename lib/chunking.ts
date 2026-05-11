export type TextChunk = {
  content: string
  chunkIndex: number
}

const MAX_CHARS = 1500
const OVERLAP_CHARS = 150
const MIN_BODY_CHARS = 10  // skip sections with effectively empty bodies

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalise(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Only ## and ### are section boundaries; # is the document title, not a section.
function hasMarkdownSections(text: string): boolean {
  return /^#{2,3} .+/m.test(text)
}

// Split a section body that is too long into overlapping paragraph-based sub-chunks.
function splitLongSection(body: string, prefix: string): string[] {
  const paragraphs = body.split(/\n\n+/)
  const result: string[] = []
  let current = prefix + '\n\n'

  for (const para of paragraphs) {
    const candidate = current + para
    if (candidate.length > MAX_CHARS && current.length > prefix.length + 2) {
      result.push(current.trimEnd())
      // Overlap: restart with last paragraph of the previous sub-chunk
      const lastParaStart = current.lastIndexOf('\n\n')
      const overlap = lastParaStart !== -1 ? current.slice(lastParaStart + 2) : ''
      current = prefix + '\n\n' + overlap + (overlap ? '\n\n' : '') + para
    } else {
      current = candidate + '\n\n'
    }
  }

  const last = current.trimEnd()
  if (last.length > prefix.length + 2) result.push(last)

  return result.length > 0 ? result : [prefix + '\n\n' + body.trim()]
}

// ── Markdown-aware path ───────────────────────────────────────────────────────

function chunkMarkdown(text: string, title: string): TextChunk[] {
  // Split on ## and ### headings only — # (h1 title) stays in preamble
  const sectionPattern = /^(#{2,3} .+)$/m
  const parts = text.split(sectionPattern)

  // parts = [preamble, heading1, body1, heading2, body2, ...]
  const rawChunks: string[] = []

  // Preamble: everything before the first ## heading
  const preamble = parts[0].trim()
  if (preamble.length >= MIN_BODY_CHARS) {
    const full = `[${title}]\n\n${preamble}`
    if (full.length <= MAX_CHARS) {
      rawChunks.push(full)
    } else {
      rawChunks.push(...splitLongSection(preamble, `[${title}]`))
    }
  }

  // Sections
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].replace(/^#+\s*/, '').trim()
    const body = (parts[i + 1] ?? '').trim()

    if (body.length < MIN_BODY_CHARS) continue  // skip empty/trivial sections

    const prefix = `[${title} > ${heading}]`
    const full = `${prefix}\n\n${body}`

    if (full.length <= MAX_CHARS) {
      rawChunks.push(full)
    } else {
      rawChunks.push(...splitLongSection(body, prefix))
    }
  }

  return rawChunks
    .filter((c) => c.trim().length > 0)
    .map((content, i) => ({ content: content.trim(), chunkIndex: i }))
}

// ── Plain-text fallback ───────────────────────────────────────────────────────

function chunkPlainText(text: string): TextChunk[] {
  const chunks: TextChunk[] = []
  let start = 0
  let index = 0

  while (start < text.length) {
    const end = start + MAX_CHARS
    let chunkEnd = end

    if (end < text.length) {
      const lookback = text.slice(Math.max(start, end - 200), end)
      const paraBreak = lookback.lastIndexOf('\n\n')
      const sentenceBreak = lookback.lastIndexOf('. ')

      if (paraBreak !== -1) {
        chunkEnd = Math.max(start, end - 200) + paraBreak + 2
      } else if (sentenceBreak !== -1) {
        chunkEnd = Math.max(start, end - 200) + sentenceBreak + 2
      }
    }

    const content = text.slice(start, chunkEnd).trim()
    if (content.length > 0) {
      chunks.push({ content, chunkIndex: index++ })
    }

    start = chunkEnd - OVERLAP_CHARS
    if (start >= text.length) break
  }

  return chunks
}

// ── Public API ────────────────────────────────────────────────────────────────

export function chunkText(text: string, title = 'Document'): TextChunk[] {
  const cleaned = normalise(text)
  if (!cleaned) return []

  return hasMarkdownSections(cleaned)
    ? chunkMarkdown(cleaned, title)
    : chunkPlainText(cleaned)
}
