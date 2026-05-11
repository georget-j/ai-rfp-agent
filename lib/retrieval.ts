import { getServiceSupabase } from './supabase'
import { generateEmbedding } from './embeddings'
import type { RetrievedChunk } from './schema'

export async function retrieveChunks(
  queryText: string,
  matchCount = 6,
  similarityThreshold = 0.3,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(queryText)
  const supabase = getServiceSupabase()

  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  })

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`)
  }

  return (data ?? []) as RetrievedChunk[]
}
