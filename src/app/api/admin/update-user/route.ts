// src/app/api/admin/update-user/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

// Allowlist of fields the admin panel is permitted to update.
const ALLOWED_FIELDS = ['is_admin'] as const
type AllowedField = (typeof ALLOWED_FIELDS)[number]

import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // 1. Identify User using standard client (cookies + anon key)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check Admin status safely
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminId = user.id

    // 3. Process Payload
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

    // 4. Perform Admin update using Stateless Service Role Client
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId)

    if (updateError) {
      console.error('[Admin] Supabase user update error:', updateError)
      throw updateError
    }

    return NextResponse.json({ success: true, userId, field, value })
  } catch (error: any) {
    console.error('Admin update-user error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' }, 
      { status: 500 }
    )
  }
}
