import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

export const CHAT_MODEL = 'gpt-4o-mini'
