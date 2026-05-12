export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { extractText, ALLOWED_EXTENSIONS } from '@/lib/extractors'
import { extractRFPQuestions } from '@/lib/rfp-extract'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 4 * 1024 * 1024

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'upload')
  if (limited) return limited

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `Unsupported format: ${ext}` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extraction = await extractText(buffer, file.name, file.type)

    if (!extraction.text.trim()) {
      return NextResponse.json({ error: 'No readable text found in file' }, { status: 400 })
    }

    const questions = await extractRFPQuestions(extraction.text)

    return NextResponse.json({ questions, total: questions.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[rfp/extract]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
