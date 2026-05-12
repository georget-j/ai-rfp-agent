import type { RetrievedChunk, RFPContext } from './schema'

export function buildRerankPrompt(query: string, chunks: RetrievedChunk[]): string {
  const list = chunks
    .map((c, i) =>
      `[${i + 1}] chunk_id: ${c.id}\nsource: ${c.document_title}\n${c.content.slice(0, 400)}`,
    )
    .join('\n\n')

  return `Rank these document excerpts by relevance to the query. Return only the chunk_ids of the best ones.

Query: ${query}

Excerpts:
${list}`
}

export function buildSystemPrompt(): string {
  return `You are an enterprise proposal and solutions assistant.

You help draft RFP responses using only the provided source material.

Rules:
- You must not invent facts, metrics, certifications, customer names, or capabilities.
- If evidence is insufficient to support a claim, flag it in missing_information instead.
- When source chunks provide strong evidence, cite them using their exact chunk_id.
- Distinguish between strong evidence (direct, specific, quantified) and weak evidence (general or indirect).
- Write in a concise, credible, enterprise-ready style.
- Return structured JSON matching the required schema exactly.
- The draft_answer should be a polished, complete response suitable for sending to a customer.
- Executive summary should be 2-3 sentences maximum.`
}

export function buildUserPrompt(
  query: string,
  chunks: RetrievedChunk[],
  rfpContext?: RFPContext,
): string {
  const contextLines: string[] = []

  if (rfpContext?.industry) contextLines.push(`Industry: ${rfpContext.industry}`)
  if (rfpContext?.response_type) contextLines.push(`Response type: ${rfpContext.response_type}`)
  if (rfpContext?.tone) contextLines.push(`Tone: ${rfpContext.tone}`)
  if (rfpContext?.customer_maturity) contextLines.push(`Customer maturity: ${rfpContext.customer_maturity}`)

  const contextSection = contextLines.length > 0
    ? `\nRFP Context:\n${contextLines.join('\n')}\n`
    : ''

  const chunksSection = chunks.length > 0
    ? chunks.map((c, i) =>
        `[CHUNK ${i + 1}]\nchunk_id: ${c.id}\nsource: ${c.document_title}\n---\n${c.content}`
      ).join('\n\n')
    : 'No relevant source chunks were found.'

  return `Question: ${query}
${contextSection}
Source material (answer only from these chunks — do not invent information):

${chunksSection}

Generate a structured RFP response based strictly on the above source material.
If the source material does not contain enough information to answer confidently, reflect this in the confidence level and missing_information fields.`
}
