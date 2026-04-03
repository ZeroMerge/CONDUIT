// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * A server-side Supabase client using the SERVICE_ROLE_KEY.
 * This client bypasses RLS and should ONLY be used in secure 
 * server-side contexts (API routes, Server Actions).
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
