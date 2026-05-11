import { openai, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from './openai'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, ' '),
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return response.data[0].embedding
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.replace(/\n/g, ' ')),
    dimensions: EMBEDDING_DIMENSIONS,
  })

  // Preserve original order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}
