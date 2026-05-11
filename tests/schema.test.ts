import { describe, it, expect } from 'vitest'
import { RFPResponseSchema, AskRequestSchema } from '../lib/schema'

const validResponse = {
  draft_answer: 'Based on our case study with Meridian Digital Bank, we reduced AML review time by 35%.',
  executive_summary: 'Our AI triage layer reduced alert review time by 35% at a digital bank.',
  supporting_evidence: [
    {
      claim: 'Review time reduced by 35%',
      source_chunk_ids: ['chunk-1'],
      strength: 'strong',
    },
  ],
  citations: [
    {
      source_title: 'Fintech AML Case Study',
      chunk_id: 'chunk-1',
      excerpt: 'Review time reduced by 35% after AI triage deployment.',
      relevance: 'Directly addresses the question about AML review time reduction.',
    },
  ],
  missing_information: [
    {
      item: 'Customer-specific alert volume baseline',
      why_it_matters: 'Allows us to size the expected improvement for this customer.',
      suggested_owner: 'customer',
    },
  ],
  confidence: {
    level: 'high',
    reason: 'Strong evidence from a directly relevant case study.',
  },
  suggested_next_actions: [
    'Ask customer for current alert volume and review time baseline.',
    'Share Meridian Digital Bank case study summary.',
  ],
}

describe('RFPResponseSchema', () => {
  it('accepts a valid response', () => {
    expect(() => RFPResponseSchema.parse(validResponse)).not.toThrow()
  })

  it('returns typed result with correct structure', () => {
    const result = RFPResponseSchema.parse(validResponse)
    expect(result.confidence.level).toBe('high')
    expect(result.supporting_evidence[0].strength).toBe('strong')
    expect(result.citations[0].chunk_id).toBe('chunk-1')
  })

  it('rejects missing required fields', () => {
    const { draft_answer: _, ...withoutDraftAnswer } = validResponse
    expect(() => RFPResponseSchema.parse(withoutDraftAnswer)).toThrow()
  })

  it('rejects invalid confidence level', () => {
    const invalid = { ...validResponse, confidence: { level: 'very-high', reason: 'test' } }
    expect(() => RFPResponseSchema.parse(invalid)).toThrow()
  })

  it('rejects invalid evidence strength', () => {
    const invalid = {
      ...validResponse,
      supporting_evidence: [{ ...validResponse.supporting_evidence[0], strength: 'excellent' }],
    }
    expect(() => RFPResponseSchema.parse(invalid)).toThrow()
  })

  it('rejects invalid suggested_owner', () => {
    const invalid = {
      ...validResponse,
      missing_information: [{ ...validResponse.missing_information[0], suggested_owner: 'CEO' }],
    }
    expect(() => RFPResponseSchema.parse(invalid)).toThrow()
  })

  it('accepts empty arrays for optional list fields', () => {
    const minimal = {
      ...validResponse,
      supporting_evidence: [],
      citations: [],
      missing_information: [],
      suggested_next_actions: [],
    }
    expect(() => RFPResponseSchema.parse(minimal)).not.toThrow()
  })
})

describe('AskRequestSchema', () => {
  it('accepts a simple query', () => {
    const result = AskRequestSchema.parse({ query: 'How do we handle AML?' })
    expect(result.query).toBe('How do we handle AML?')
    expect(result.rfp_context).toBeUndefined()
  })

  it('accepts query with rfp_context', () => {
    const result = AskRequestSchema.parse({
      query: 'Tell me about security',
      rfp_context: { industry: 'fintech', tone: 'formal' },
    })
    expect(result.rfp_context?.industry).toBe('fintech')
  })

  it('rejects empty query', () => {
    expect(() => AskRequestSchema.parse({ query: '' })).toThrow()
  })

  it('rejects query over 2000 chars', () => {
    expect(() => AskRequestSchema.parse({ query: 'A'.repeat(2001) })).toThrow()
  })

  it('rejects invalid industry value', () => {
    expect(() => AskRequestSchema.parse({
      query: 'test',
      rfp_context: { industry: 'mining' },
    })).toThrow()
  })
})
