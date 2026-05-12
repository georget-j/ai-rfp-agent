import { NextResponse } from 'next/server'
import * as z from 'zod'
import { getAuthUser } from '@/lib/supabase-server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const PatchRoutingSchema = z.object({
  owner_email: z.string().email().optional(),
  backup_email: z.string().email().optional().nullable(),
  slack_webhook_url: z.string().url().optional().nullable(),
  preferred_channel: z.enum(['email', 'slack', 'both']).optional(),
  escalation_hours: z.number().int().positive().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PatchRoutingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('routing_config')
    .update(parsed.data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getServiceSupabase()

  const { error } = await supabase.from('routing_config').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new Response(null, { status: 204 })
}
