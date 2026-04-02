import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
    try {
        const { flowId } = await request.json()
        const cookieStore = await cookies()

        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() { } } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Fetch Original Flow
        const { data: originalFlow, error: flowError } = await supabase.from('flows').select('*').eq('id', flowId).single()
        if (flowError || !originalFlow) throw new Error('Flow not found')

        // 2. Fetch Original Steps
        const { data: originalSteps } = await supabase.from('steps').select('*').eq('flow_id', flowId).order('order_index', { ascending: true })

        // 3. Insert Cloned Flow
        const { data: newFlow, error: cloneError } = await supabase.from('flows').insert({
            title: `Fork of ${originalFlow.title}`,
            description: originalFlow.description,
            category: originalFlow.category,
            estimated_minutes: originalFlow.estimated_minutes,
            creator_id: user.id,
            status: 'unverified',
            safety_status: originalFlow.safety_status,
            parent_flow_id: originalFlow.id,
            xp_reward: originalFlow.xp_reward
        }).select('id').single()

        if (cloneError) throw cloneError

        // 4. Insert Cloned Steps
        if (originalSteps && originalSteps.length > 0) {
            const clonedSteps = originalSteps.map(step => ({
                flow_id: newFlow.id,
                order_index: step.order_index,
                title: step.title,
                instruction: step.instruction,
                prompt_text: step.prompt_text,
                expected_outcome: step.expected_outcome,
                example_output: step.example_output
            }))
            await supabase.from('steps').insert(clonedSteps)
        }

        // 5. Increment Fork Count on Original
        await supabase.rpc('increment_fork_count', { target_flow_id: originalFlow.id })

        return NextResponse.json({ newFlowId: newFlow.id })

    } catch (error) {
        console.error('Fork API Error:', error)
        return NextResponse.json({ error: 'Failed to fork flow' }, { status: 500 })
    }
}