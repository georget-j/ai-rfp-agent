import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from '../lib/prompts'
import type { RetrievedChunk, RFPContext } from '../lib/schema'

const mockChunks: RetrievedChunk[] = [
  {
    id: 'chunk-1',
    document_id: 'doc-1',
    document_title: 'Fintech AML Case Study',
    content: 'Review time reduced by 35% after AI triage deployment.',
    similarity: 0.87,
    metadata: null,
  },
  {
    id: 'chunk-2',
    document_id: 'doc-2',
    document_title: 'Enterprise Security Note',
    content: 'SOC 2 Type I completed. Type II in progress.',
    similarity: 0.71,
    metadata: null,
  },
]

describe('buildSystemPrompt', () => {
  it('is a non-empty string', () => {
    const prompt = buildSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(50)
  })

  it('instructs the model not to invent facts', () => {
    const prompt = buildSystemPrompt()
    expect(prompt.toLowerCase()).toMatch(/not invent|must not invent/)
  })

  it('instructs the model to cite sources', () => {
    const prompt = buildSystemPrompt()
    expect(prompt.toLowerCase()).toMatch(/cite|citation/)
  })

  it('instructs the model to flag missing information', () => {
    const prompt = buildSystemPrompt()
    expect(prompt.toLowerCase()).toMatch(/missing|insufficient/)
  })

  it('instructs the model to return structured JSON', () => {
    const prompt = buildSystemPrompt()
    expect(prompt.toLowerCase()).toMatch(/json|structured/)
  })
})

describe('buildUserPrompt', () => {
  it('includes the query text', () => {
    const query = 'How do we reduce AML review time?'
    const prompt = buildUserPrompt(query, mockChunks)
    expect(prompt).toContain(query)
  })

  it('includes chunk content', () => {
    const prompt = buildUserPrompt('test', mockChunks)
    expect(prompt).toContain('Review time reduced by 35%')
    expect(prompt).toContain('SOC 2 Type I completed')
  })

  it('includes chunk IDs for citation', () => {
    const prompt = buildUserPrompt('test', mockChunks)
    expect(prompt).toContain('chunk-1')
    expect(prompt).toContain('chunk-2')
  })

  it('includes document titles', () => {
    const prompt = buildUserPrompt('test', mockChunks)
    expect(prompt).toContain('Fintech AML Case Study')
    expect(prompt).toContain('Enterprise Security Note')
  })

  it('handles empty chunks gracefully', () => {
    const prompt = buildUserPrompt('test', [])
    expect(prompt).toContain('No relevant source chunks')
  })

  it('includes rfp context when provided', () => {
    const ctx: RFPContext = { industry: 'fintech', tone: 'formal' }
    const prompt = buildUserPrompt('test', mockChunks, ctx)
    expect(prompt).toContain('fintech')
    expect(prompt).toContain('formal')
  })

  it('does not include rfp context section when not provided', () => {
    const prompt = buildUserPrompt('test', mockChunks)
    expect(prompt).not.toContain('RFP Context:')
  })

  it('includes instruction to answer only from context', () => {
    const prompt = buildUserPrompt('test', mockChunks)
    expect(prompt.toLowerCase()).toMatch(/only from|do not invent/)
  })
})
