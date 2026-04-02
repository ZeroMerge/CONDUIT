// src/app/api/admin/delete-flow/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

async function getAdminSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Service role key bypasses RLS so the admin can delete any flow.
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

export async function DELETE(request: Request) {
  try {
    const supabase = await getAdminSupabase()

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { flowId } = await request.json()

    if (!flowId) {
      return NextResponse.json({ error: 'flowId is required' }, { status: 400 })
    }

    // The database schema uses ON DELETE CASCADE for steps, completions, likes,
    // comments, and user_skills references — so deleting the flow is sufficient.
    // Parent_flow_id on forked flows uses ON DELETE SET NULL, so forks survive.
    const { error } = await supabase.from('flows').delete().eq('id', flowId)

    if (error) throw error

    return NextResponse.json({ success: true, flowId })
  } catch (error) {
    console.error('Admin delete-flow error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
