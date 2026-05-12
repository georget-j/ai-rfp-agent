import { NextRequest, NextResponse } from 'next/server'
import { ingestDocument } from '@/lib/documents'
import { extractText, ALLOWED_EXTENSIONS } from '@/lib/extractors'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'upload')
  if (limited) return limited

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${ext}". Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extraction = await extractText(buffer, file.name, file.type)

    if (!extraction.text.trim()) {
      return NextResponse.json(
        { error: 'File appears to be empty or contains no readable text.' },
        { status: 400 }
      )
    }

    const result = await ingestDocument({
      text: extraction.text,
      title: extraction.title,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sourceType: 'upload',
      pageCount: extraction.pageCount,
      wordCount: extraction.wordCount,
      extractionWarnings: extraction.warnings,
      fileSizeBytes: file.size,
    })

    return NextResponse.json({ ...result, warnings: extraction.warnings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[upload]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
