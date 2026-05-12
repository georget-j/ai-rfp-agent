import { NextResponse } from 'next/server'
import * as z from 'zod'
import { getServiceSupabase } from '@/lib/supabase'
import { logReviewAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const CommentSchema = z.object({
  author_email: z.email(),
  body: z.string().min(1).max(2000),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('review_comments')
    .select('id, author_email, body, created_at')
    .eq('review_request_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let author_email: string
  let body: string
  try {
    const raw = await req.json()
    const parsed = CommentSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
    }
    author_email = parsed.data.author_email
    body = parsed.data.body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_request_id: id, author_email, body })
    .select('id, author_email, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logReviewAction(id, author_email, 'commented', {
    body_excerpt: body.slice(0, 100),
  })

  return NextResponse.json(data)
}
