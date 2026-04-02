// src/app/api/admin/update-user/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

// Allowlist of fields the admin panel is permitted to update.
// Add fields here as the admin grows — never expose arbitrary column writes.
const ALLOWED_FIELDS = ['is_admin'] as const
type AllowedField = (typeof ALLOWED_FIELDS)[number]

async function getAdminSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
}

async function isAdmin(supabase: any): Promise<{ ok: boolean; userId?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return { ok: profile?.is_admin === true, userId: user.id }
}

export async function POST(request: Request) {
  try {
    const supabase = await getAdminSupabase()
    const { ok, userId: adminId } = await isAdmin(supabase)

    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId, field, value } = await request.json()

    if (!userId || !field || value === undefined) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Safety: only allow pre-approved field names
    if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
      return NextResponse.json({ error: `Field '${field}' is not updatable` }, { status: 400 })
    }

    // Prevent self-demotion from admin
    if (field === 'is_admin' && value === false && userId === adminId) {
      return NextResponse.json(
        { error: "You cannot remove your own admin status." },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true, userId, field, value })
  } catch (error) {
    console.error('Admin update-user error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
