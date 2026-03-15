import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID!
