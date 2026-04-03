// src/app/api/admin/verify-flow/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

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

    if (profileError) {
      console.error('[Admin] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Profile authorization check failed', details: profileError.code }, 
        { status: 403 }
      )
    }

    if (!profile?.is_admin) {
      console.warn(`[Admin] Unauthorized access attempt by user ${user.id}`)
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // 3. Process Payload
    const { flowId, status } = await request.json()

    if (!flowId || !['verified', 'unverified', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    console.log(`[Admin] Updating flow ${flowId} status to ${status}...`)

    // 4. Perform Admin update using Stateless Service Role Client
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('flows')
      .update({ status })
      .eq('id', flowId)

    if (updateError) {
      console.error('[Admin] Supabase update error:', updateError)
      throw updateError
    }

    console.log(`[Admin] Successfully updated flow ${flowId}`)

    return NextResponse.json({ success: true, flowId, status })
  } catch (error: any) {
    console.error('Admin verify-flow error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Server error',
        details: error.code || error.message || undefined,
        hint: error.message?.includes('admin environment variables') 
          ? 'Check SUPABASE_SERVICE_ROLE_KEY' 
          : undefined
      }, 
      { status: 500 }
    )
  }
}
