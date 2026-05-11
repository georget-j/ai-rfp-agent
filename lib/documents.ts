import { getServiceSupabase } from './supabase'
import { chunkText } from './chunking'
import { generateEmbeddingsBatch } from './embeddings'
import type { IngestResult } from './schema'

type IngestInput = {
  text: string
  title: string
  fileName?: string
  mimeType?: string
  sourceType: 'upload' | 'sample'
}

export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const { text, title, fileName, mimeType, sourceType } = input

  if (!text.trim()) throw new Error('Document text is empty')

  const supabase = getServiceSupabase()

  // Save document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      title,
      source_type: sourceType,
      file_name: fileName ?? null,
      mime_type: mimeType ?? null,
      raw_text: text,
    })
    .select('id')
    .single()

  if (docError || !doc) {
    throw new Error(`Failed to save document: ${docError?.message}`)
  }

  // Chunk the text
  const chunks = chunkText(text, title)
  if (chunks.length === 0) throw new Error('Document produced no chunks')

  // Generate embeddings in batch
  const embeddings = await generateEmbeddingsBatch(chunks.map((c) => c.content))

  // Insert chunks with embeddings
  const rows = chunks.map((chunk, i) => ({
    document_id: doc.id,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    token_count: Math.round(chunk.content.length / 4), // rough estimate
    embedding: JSON.stringify(embeddings[i]),
    metadata: { title, source_type: sourceType },
  }))

  const { error: chunkError } = await supabase.from('document_chunks').insert(rows)

  if (chunkError) {
    // Roll back document if chunks fail
    await supabase.from('documents').delete().eq('id', doc.id)
    throw new Error(`Failed to save chunks: ${chunkError.message}`)
  }

  return { document_id: doc.id, chunk_count: chunks.length, title }
}

export async function getDocuments() {
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, source_type, file_name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`)
  return data ?? []
}

export async function getDocumentChunkCount(documentId: string): Promise<number> {
  const supabase = getServiceSupabase()

  const { count, error } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('document_id', documentId)

  if (error) return 0
  return count ?? 0
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = getServiceSupabase()
  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  if (error) throw new Error(`Failed to delete document: ${error.message}`)
}

export async function documentExists(title: string): Promise<boolean> {
  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from('documents')
    .select('id')
    .eq('title', title)
    .maybeSingle()
  return !!data
}
