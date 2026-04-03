// src/app/api/admin/delete-flow/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: Request) {
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

    // 3. Process Payload
    const { flowId } = await request.json()

    if (!flowId) {
      return NextResponse.json({ error: 'flowId is required' }, { status: 400 })
    }

    // 4. Perform Admin delete using Stateless Service Role Client
    const adminSupabase = createAdminClient()
    const { error: deleteError } = await adminSupabase
      .from('flows')
      .delete()
      .eq('id', flowId)

    if (deleteError) {
      console.error('[Admin] Supabase delete error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true, flowId })
  } catch (error: any) {
    console.error('Admin delete-flow error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' }, 
      { status: 500 }
    )
  }
}
