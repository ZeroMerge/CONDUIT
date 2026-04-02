// src/app/api/admin/verify-flow/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

async function getAdminSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Use service role key so we can bypass RLS for admin writes.
    // Falls back to anon key so the build doesn't crash if the env var is absent.
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
}

async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin === true
}

export async function POST(request: Request) {
  try {
    const supabase = await getAdminSupabase()

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { flowId, status } = await request.json()

    if (!flowId || !['verified', 'unverified', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('flows')
      .update({ status })
      .eq('id', flowId)

    if (error) throw error

    return NextResponse.json({ success: true, flowId, status })
  } catch (error) {
    console.error('Admin verify-flow error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
