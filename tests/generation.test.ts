import { describe, it, expect } from 'vitest'
import { verifyCitations } from '../lib/citations'
import type { RFPResponse } from '../lib/schema'

const baseResponse: RFPResponse = {
  draft_answer: 'Our AI triage layer reduced AML review time by 35%.',
  executive_summary: 'Review time reduced by 35% at Meridian Digital Bank.',
  supporting_evidence: [
    { claim: 'Review time reduced by 35%', source_chunk_ids: ['chunk-1', 'chunk-2'], strength: 'strong' },
    { claim: 'Escalations reduced by 22%', source_chunk_ids: ['chunk-3'], strength: 'medium' },
  ],
  citations: [
    { source_title: 'Fintech AML Case Study', chunk_id: 'chunk-1', excerpt: 'Review time reduced by 35%.', relevance: 'Direct evidence.' },
    { source_title: 'Fintech AML Case Study', chunk_id: 'chunk-2', excerpt: 'Alert volume down.', relevance: 'Supporting context.' },
    { source_title: 'Product Overview', chunk_id: 'chunk-3', excerpt: 'AI triage capabilities.', relevance: 'Capability evidence.' },
  ],
  missing_information: [],
  confidence: { level: 'high', reason: 'Strong direct evidence.' },
  suggested_next_actions: ['Share case study with customer.'],
}

describe('verifyCitations', () => {
  it('returns response unchanged when all citations are valid', () => {
    const ids = new Set(['chunk-1', 'chunk-2', 'chunk-3'])
    const { response, removedCount } = verifyCitations(baseResponse, ids)
    expect(removedCount).toBe(0)
    expect(response.citations).toHaveLength(3)
    expect(response.supporting_evidence[0].source_chunk_ids).toEqual(['chunk-1', 'chunk-2'])
    expect(response.supporting_evidence[1].source_chunk_ids).toEqual(['chunk-3'])
  })

  it('strips citations whose chunk_id is not in the retrieved set', () => {
    const ids = new Set(['chunk-1', 'chunk-3'])
    const { response, removedCount } = verifyCitations(baseResponse, ids)
    // citations: chunk-2 removed (1); supporting_evidence[0]: chunk-2 removed (1) → total 2
    expect(removedCount).toBe(2)
    expect(response.citations.map((c) => c.chunk_id)).toEqual(['chunk-1', 'chunk-3'])
  })

  it('strips source_chunk_ids in supporting_evidence that are not in the retrieved set', () => {
    const ids = new Set(['chunk-1', 'chunk-3'])
    const { response } = verifyCitations(baseResponse, ids)
    expect(response.supporting_evidence[0].source_chunk_ids).toEqual(['chunk-1'])
    expect(response.supporting_evidence[1].source_chunk_ids).toEqual(['chunk-3'])
  })

  it('counts removals across both citations and supporting_evidence', () => {
    const ids = new Set(['chunk-1'])
    const { removedCount } = verifyCitations(baseResponse, ids)
    // citations: chunk-2 and chunk-3 removed = 2
    // supporting_evidence: chunk-2 and chunk-3 removed = 2
    expect(removedCount).toBe(4)
  })

  it('strips all citations when the retrieved set is empty', () => {
    const { response, removedCount } = verifyCitations(baseResponse, new Set())
    expect(response.citations).toHaveLength(0)
    // 3 citations + 3 supporting_evidence ids (chunk-1, chunk-2, chunk-3) = 6
    expect(removedCount).toBe(6)
  })

  it('handles empty citations and supporting_evidence gracefully', () => {
    const empty: RFPResponse = {
      ...baseResponse,
      citations: [],
      supporting_evidence: [],
    }
    const { response, removedCount } = verifyCitations(empty, new Set(['chunk-1']))
    expect(removedCount).toBe(0)
    expect(response.citations).toHaveLength(0)
    expect(response.supporting_evidence).toHaveLength(0)
  })

  it('does not mutate the original response', () => {
    const ids = new Set(['chunk-1'])
    verifyCitations(baseResponse, ids)
    expect(baseResponse.citations).toHaveLength(3)
    expect(baseResponse.supporting_evidence[0].source_chunk_ids).toEqual(['chunk-1', 'chunk-2'])
  })

  it('preserves all other response fields unchanged', () => {
    const ids = new Set(['chunk-1', 'chunk-2', 'chunk-3'])
    const { response } = verifyCitations(baseResponse, ids)
    expect(response.draft_answer).toBe(baseResponse.draft_answer)
    expect(response.executive_summary).toBe(baseResponse.executive_summary)
    expect(response.confidence).toEqual(baseResponse.confidence)
    expect(response.missing_information).toEqual(baseResponse.missing_information)
    expect(response.suggested_next_actions).toEqual(baseResponse.suggested_next_actions)
  })
})
