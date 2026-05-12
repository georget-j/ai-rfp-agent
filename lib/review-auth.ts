import { createClient } from '@supabase/supabase-js'

// Admin client needed for generateLink
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function generateReviewMagicLink(
  email: string,
  reviewId: string,
): Promise<string | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ?? ''
  const redirectTo = `${appUrl}/auth/callback?redirectTo=/review/${reviewId}`

  const supabase = getAdminSupabase()
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error || !data.properties?.action_link) {
    console.error('[review-auth] generateLink failed:', error?.message)
    return null
  }

  return data.properties.action_link
}
