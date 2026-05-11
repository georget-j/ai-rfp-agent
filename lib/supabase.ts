import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client (anon key) — used in client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client (service role) — used in API routes and server components
export function getServiceSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}
