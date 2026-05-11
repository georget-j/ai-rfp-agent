import { getServiceSupabase } from './supabase'
import { generateEmbedding } from './embeddings'
import type { RetrievedChunk } from './schema'

export async function retrieveChunks(
  queryText: string,
  matchCount = 6,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(queryText)
  const supabase = getServiceSupabase()

  const { data, error } = await supabase.rpc('hybrid_search_chunks', {
    query_text: queryText,
    query_embedding: queryEmbedding,
    match_count: matchCount,
  })

  if (error) {
    throw new Error(`Hybrid search failed: ${error.message}`)
  }

  return (data ?? []) as RetrievedChunk[]
}
