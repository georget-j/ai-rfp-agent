import { NextRequest, NextResponse } from 'next/server'
import { ingestDocument } from '@/lib/documents'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown']
const ALLOWED_EXTENSIONS = ['.txt', '.md']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only .txt and .md files are supported.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const text = await file.text()
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'File appears to be empty or contains no readable text.' },
        { status: 400 }
      )
    }

    const title = file.name.replace(/\.(txt|md)$/i, '').replace(/[-_]/g, ' ')

    const result = await ingestDocument({
      text,
      title,
      fileName: file.name,
      mimeType: file.type || 'text/plain',
      sourceType: 'upload',
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[upload]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
