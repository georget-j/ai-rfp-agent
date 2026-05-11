import type { RFPResponse } from './schema'

export function verifyCitations(
  response: RFPResponse,
  retrievedIds: Set<string>,
): { response: RFPResponse; removedCount: number } {
  let removedCount = 0

  const citations = response.citations.filter((c) => {
    if (retrievedIds.has(c.chunk_id)) return true
    removedCount++
    return false
  })

  const supporting_evidence = response.supporting_evidence.map((e) => {
    const validIds = e.source_chunk_ids.filter((id) => {
      if (retrievedIds.has(id)) return true
      removedCount++
      return false
    })
    return { ...e, source_chunk_ids: validIds }
  })

  return {
    response: { ...response, citations, supporting_evidence },
    removedCount,
  }
}
