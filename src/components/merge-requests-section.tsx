'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { acceptMergeRequest } from '@/app/actions/merge-requests'
import { GitPullRequest, GitMerge, Check, X } from 'lucide-react'
import { useUserStore } from '@/lib/stores/user'
import { toast } from 'sonner'
import type { MergeRequestWithDetails } from '@/types'
import { Avatar } from './avatar'
import Link from 'next/link'

export function MergeRequestsSection({ flowId }: { flowId: string }) {
  const [requests, setRequests] = useState<MergeRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [mergingId, setMergingId] = useState<string | null>(null)
  
  const { profile } = useUserStore()

  useEffect(() => {
    async function loadRequests() {
      const { data } = await supabase
        .from('merge_requests')
        .select(`*, creator:profiles(*), fork_flow:fork_flow_id(id)`)
        .eq('parent_flow_id', flowId)
        .order('created_at', { ascending: false })

      if (data) setRequests(data as any)
      setLoading(false)
    }
    loadRequests()
  }, [flowId])

  const handleMerge = async (id: string) => {
    setMergingId(id)
    try {
      await acceptMergeRequest(id)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'merged' } : r))
      toast.success('Successfully merged the branch!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to merge branch')
    } finally {
      setMergingId(null)
    }
  }

  if (loading) return <div className="animate-pulse h-10 bg-[var(--bg-secondary)] rounded w-1/3"></div>
  if (requests.length === 0) return null

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <GitPullRequest className="w-5 h-5 text-[var(--accent)]" />
        Pull Requests
      </h3>

      <div className="space-y-4">
        {requests.map(pr => (
          <div key={pr.id} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg-secondary)]">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-[var(--text-primary)] text-sm flex items-center gap-2">
                  {pr.status === 'open' && <GitPullRequest className="w-4 h-4 text-green-500" />}
                  {pr.status === 'merged' && <GitMerge className="w-4 h-4 text-purple-500" />}
                  {pr.status === 'closed' && <X className="w-4 h-4 text-red-500" />}
                  {pr.title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Opened by <Link href={`/profile/${pr.creator?.username}`} className="font-medium hover:underline">{pr.creator?.username}</Link> on {new Date(pr.created_at).toLocaleDateString()}
                </p>
                {pr.description && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2 italic bg-[var(--bg-primary)] p-2 rounded">
                    "{pr.description}"
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium tracking-wide
                  ${pr.status === 'open' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                  ${pr.status === 'merged' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : ''}
                  ${pr.status === 'closed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                `}>
                  {pr.status}
                </span>

                {pr.status === 'open' && (
                  <div className="flex gap-2 mt-2">
                    <Link
                      href={`/flow/${pr.fork_flow_id}`}
                      className="px-3 py-1.5 text-xs border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded transition"
                    >
                      View Changes
                    </Link>
                    {/* Only the flow creator (or an admin, if we had flow ownership check here) can merge. For safety we check if the backend allows it, but UI-wise we should show it if user owns parent_flow. */}
                    {/* Wait, we don't have parent flow creator in scope without passing it down. Let's just always render the Merge button if current user exists, and backend rejects if they aren't owner */}
                    {profile && (
                      <button
                        onClick={() => handleMerge(pr.id)}
                        disabled={mergingId === pr.id}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs rounded transition disabled:opacity-50"
                      >
                       {mergingId === pr.id ? '...' : <><Check className="w-3 h-3" /> Merge</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
