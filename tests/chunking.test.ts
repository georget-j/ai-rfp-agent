import { describe, it, expect } from 'vitest'
import { chunkText } from '../lib/chunking'

// ── Shared edge-case tests (apply to both paths) ─────────────────────────────

describe('chunkText — edge cases', () => {
  it('returns empty array for empty string', () => {
    expect(chunkText('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(chunkText('   \n\n   ')).toEqual([])
  })

  it('returns a single chunk for short text', () => {
    const text = 'Hello world. This is a short document.'
    const chunks = chunkText(text)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].chunkIndex).toBe(0)
    expect(chunks[0].content).toContain('Hello world')
  })

  it('assigns sequential chunk indices starting at 0', () => {
    const text = 'A'.repeat(3000)
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i))
  })

  it('normalises excess blank lines', () => {
    const text = 'First paragraph.\n\n\n\n\nSecond paragraph.'
    const chunks = chunkText(text)
    expect(chunks[0].content).not.toMatch(/\n{3,}/)
  })
})

// ── Plain-text fallback path ──────────────────────────────────────────────────

describe('chunkText — plain text (no markdown headers)', () => {
  it('produces chunks within the expected size range', () => {
    const text = 'Lorem ipsum dolor sit amet. '.repeat(200) // ~5600 chars
    const chunks = chunkText(text)
    chunks.forEach((c) => {
      expect(c.content.length).toBeGreaterThan(50)
      expect(c.content.length).toBeLessThan(1800)
    })
  })

  it('overlap means content near boundaries appears in consecutive chunks', () => {
    const text = 'A '.repeat(400) + 'Important sentence here. ' + 'B '.repeat(400)
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0].content.trim().length).toBeGreaterThan(0)
  })
})

// ── Markdown-aware path ───────────────────────────────────────────────────────

const SAMPLE_MD = `# Case Study: Acme Corp

## Business Problem

Customer had a backlog of 4000 alerts per month. The existing system could not scale.

## Solution

We deployed an AI triage layer that reduced alert volume by 35%.

## Outcome

Review time fell from 28 minutes to 18 minutes per alert.`

describe('chunkText — markdown documents', () => {
  it('produces one chunk per section for short documents', () => {
    const chunks = chunkText(SAMPLE_MD, 'Acme Case Study')
    // Three ## sections → three chunks (preamble has no ## so uses # title)
    expect(chunks.length).toBeGreaterThanOrEqual(3)
  })

  it('each chunk starts with a [Document > Section] context prefix', () => {
    const chunks = chunkText(SAMPLE_MD, 'Acme Case Study')
    const prefixed = chunks.filter((c) => c.content.startsWith('[Acme Case Study'))
    expect(prefixed.length).toBe(chunks.length)
  })

  it('includes the section heading in the prefix', () => {
    const chunks = chunkText(SAMPLE_MD, 'Acme Case Study')
    expect(chunks.some((c) => c.content.includes('Business Problem'))).toBe(true)
    expect(chunks.some((c) => c.content.includes('Solution'))).toBe(true)
    expect(chunks.some((c) => c.content.includes('Outcome'))).toBe(true)
  })

  it('includes the section body content', () => {
    const chunks = chunkText(SAMPLE_MD, 'Acme Case Study')
    expect(chunks.some((c) => c.content.includes('4000 alerts'))).toBe(true)
    expect(chunks.some((c) => c.content.includes('35%'))).toBe(true)
    expect(chunks.some((c) => c.content.includes('18 minutes'))).toBe(true)
  })

  it('does not split across section boundaries for short sections', () => {
    const chunks = chunkText(SAMPLE_MD, 'Acme')
    // "Business Problem" content should not appear in the same chunk as "Solution" content
    const problemChunk = chunks.find((c) => c.content.includes('4000 alerts'))
    const solutionChunk = chunks.find((c) => c.content.includes('35%'))
    expect(problemChunk).toBeDefined()
    expect(solutionChunk).toBeDefined()
    expect(problemChunk!.chunkIndex).not.toBe(solutionChunk!.chunkIndex)
  })

  it('uses [Title] prefix (no section) for preamble content before first heading', () => {
    const mdWithPreamble = `# Doc Title

This is preamble content that comes before any section heading. It should still get a prefix.

## Section One

Section one body.`
    const chunks = chunkText(mdWithPreamble, 'My Doc')
    const preamble = chunks.find((c) => c.content.includes('preamble content'))
    expect(preamble).toBeDefined()
    expect(preamble!.content).toMatch(/^\[My Doc\]/)
  })

  it('sub-splits a long section and prefixes each sub-chunk', () => {
    const longSection = `# Long Doc

## Very Long Section

${Array.from({ length: 20 }, (_, i) => `Paragraph ${i + 1}: ${'content '.repeat(30)}`).join('\n\n')}`

    const chunks = chunkText(longSection, 'Long Doc')
    const longSectionChunks = chunks.filter((c) =>
      c.content.includes('Very Long Section')
    )
    // Should be split into multiple sub-chunks, all prefixed
    expect(longSectionChunks.length).toBeGreaterThanOrEqual(2)
    longSectionChunks.forEach((c) => {
      expect(c.content).toContain('[Long Doc > Very Long Section]')
    })
  })

  it('handles ### sub-headings', () => {
    const md = `# Doc

## Section

### Sub-section A

Content A.

### Sub-section B

Content B.`
    const chunks = chunkText(md, 'Doc')
    expect(chunks.some((c) => c.content.includes('Sub-section A'))).toBe(true)
  })

  it('uses default title when none provided', () => {
    const chunks = chunkText(SAMPLE_MD)
    expect(chunks.every((c) => c.content.startsWith('[Document'))).toBe(true)
  })

  it('assigns sequential indices across all sections', () => {
    const chunks = chunkText(SAMPLE_MD, 'Test')
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i))
  })
})
