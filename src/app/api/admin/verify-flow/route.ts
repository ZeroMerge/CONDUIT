// src/app/api/admin/verify-flow/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

async function getAdminSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
}

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

    // 3. Process Payload
    const { flowId, status } = await request.json()

    if (!flowId || !['verified', 'unverified', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 4. Perform Admin update using Service Role
    const adminSupabase = await getAdminSupabase()
    const { error: updateError } = await adminSupabase
      .from('flows')
      .update({ status })
      .eq('id', flowId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, flowId, status })
  } catch (error: any) {
    console.error('Admin verify-flow error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' }, 
      { status: 500 }
    )
  }
}
