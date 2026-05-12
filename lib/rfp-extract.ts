import * as z from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { openai, CHAT_MODEL } from './openai'

const ExtractedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      section: z.string(),
      text: z.string(),
    }),
  ),
})

export type ExtractedQuestion = {
  id: number
  section: string
  text: string
}

const FORMAT = zodResponseFormat(ExtractedQuestionsSchema, 'rfp_questions')

export async function extractRFPQuestions(documentText: string): Promise<ExtractedQuestion[]> {
  const completion = await openai.chat.completions.parse({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an RFP document analyzer. Extract all questions, requirements, and evaluation criteria that a vendor must respond to.

For each item:
- id: sequential integer starting at 1
- section: the section or category it belongs to (e.g. "Technical Requirements", "Security & Compliance", "Implementation")
- text: the complete, self-contained question or requirement

Skip preamble, instructions to bidders, cover pages, and any content that is not a vendor requirement.`,
      },
      {
        role: 'user',
        content: `Extract all vendor requirements from this RFP:\n\n${documentText.slice(0, 14000)}`,
      },
    ],
    response_format: FORMAT,
    temperature: 0,
  })

  const parsed = completion.choices[0]?.message?.parsed
  if (!parsed) throw new Error('Failed to extract questions from document')

  return parsed.questions
}
