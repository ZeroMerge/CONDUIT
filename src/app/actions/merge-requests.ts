'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMergeRequest(parentFlowId: string, forkFlowId: string, title: string, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: request, error } = await supabase.from('merge_requests').insert({
        parent_flow_id: parentFlowId,
        fork_flow_id: forkFlowId,
        creator_id: user.id,
        title,
        description,
        status: 'open'
    }).select().single()

    if (error) {
        console.error('Error creating MR:', error)
        throw new Error('Failed to create merge request')
    }

    revalidatePath(`/flow/${parentFlowId}`)
    return request
}

export async function acceptMergeRequest(requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: pr, error: prError } = await supabase
        .from('merge_requests')
        .select('*, parent_flow:parent_flow_id(creator_id, id), fork_flow:fork_flow_id(id)')
        .eq('id', requestId)
        .single()

    if (prError || !pr) throw new Error('Merge request not found')
    
    // Type narrowing since we loaded relationships
    const parentFlow = pr.parent_flow as any
    if (parentFlow.creator_id !== user.id) throw new Error('Unauthorized. Only parent flow creator can merge.')

    // 1. Fetch fork steps
    const { data: forkSteps, error: fsError } = await supabase
        .from('steps')
        .select('*')
        .eq('flow_id', pr.fork_flow_id)
        .order('order_index', { ascending: true })
    
    if (fsError) throw new Error('Failed to load branch steps')

    // 2. Delete existing parent steps
    const { error: delError } = await supabase.from('steps').delete().eq('flow_id', pr.parent_flow_id)
    if (delError) throw new Error('Failed to delete old steps')

    // 3. Insert mapped steps into parent
    if (forkSteps && forkSteps.length > 0) {
        const newSteps = forkSteps.map(fs => ({
            flow_id: pr.parent_flow_id,
            order_index: fs.order_index,
            title: fs.title,
            instruction: fs.instruction,
            prompt_text: fs.prompt_text,
            expected_outcome: fs.expected_outcome,
            example_output: fs.example_output
        }))
        const { error: insError } = await supabase.from('steps').insert(newSteps)
        if (insError) throw new Error('Failed to copy new steps')
    }

    // 4. Merge PR
    const { error: mergeError } = await supabase.from('merge_requests').update({ status: 'merged' }).eq('id', requestId)
    if (mergeError) throw new Error('Failed to mark PR as merged')
    
    revalidatePath(`/flow/${pr.parent_flow_id}`)
}
