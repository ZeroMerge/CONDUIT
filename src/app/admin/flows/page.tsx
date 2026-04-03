// src/app/admin/flows/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/avatar'
import { TrustBadge } from '@/components/trust-badge'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  GitFork,
  Loader2,
} from 'lucide-react'
import type { Flow, Profile } from '@/types'

type FlowWithCreator = Flow & { creator?: Profile | null }
type FilterStatus = 'all' | 'pending' | 'verified' | 'unverified'

export default function AdminFlowsPage() {
  const [flows, setFlows] = useState<FlowWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchFlows = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('flows')
        .select('*, creator:profiles(*)')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setFlows(data || [])
    } catch (err) {
      toast.error('Failed to load flows')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchFlows()
  }, [fetchFlows])

  const updateFlowStatus = async (
    flowId: string,
    status: 'verified' | 'unverified' | 'pending'
  ) => {
    setActionLoading(flowId + status)
    try {
      const res = await fetch('/api/admin/verify-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId, status }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Flow marked as ${status}`)
      setFlows((prev) =>
        prev.map((f) => (f.id === flowId ? { ...f, status } : f))
      )
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteFlow = async (flowId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setActionLoading(flowId + 'delete')
    try {
      const res = await fetch('/api/admin/delete-flow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowId }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Flow deleted')
      setFlows((prev) => prev.filter((f) => f.id !== flowId))
    } catch {
      toast.error('Failed to delete flow')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = flows.filter((f) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      (f.creator as any)?.username?.toLowerCase().includes(q)
    )
  })

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All Flows' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' },
  ]

  return (
    <div className="space-y-6 fade-in animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-geist font-bold text-[var(--text-primary)]">
            Flow Management
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            {flows.length} flows total
          </p>
        </div>
        <button
          onClick={fetchFlows}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors px-4 py-2 border border-[var(--border)] rounded-xl press-scale shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Database
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide snap-x px-1 -ml-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`snap-start px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 press-scale ${
                filter === opt.value
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md shadow-black/10'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search flows, creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--accent)] transition-all"
          />
        </div>
      </div>

      {/* Flow Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
          <p className="text-[var(--text-tertiary)] text-sm font-medium">No flows found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((flow) => (
            <div
              key={flow.id}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 md:p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-wrap pr-4">
                       <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                         {flow.title}
                       </h3>
                       <TrustBadge status={flow.status} size="sm" />
                       <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-1 rounded-lg text-[var(--text-secondary)]">
                         {flow.category}
                       </span>
                       {flow.parent_flow_id && (
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-1 rounded-lg text-[10px] uppercase font-bold tracking-widest text-[var(--accent)]">
                           <GitFork className="h-3 w-3" /> Forked
                         </span>
                       )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-[var(--text-secondary)] line-clamp-2 md:line-clamp-1 max-w-3xl leading-relaxed">
                    {flow.description}
                  </p>

                  <div className="flex items-center gap-4 mt-4 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold text-[var(--text-tertiary)]">
                    {(flow.creator as any) && (
                      <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)]">
                        <Avatar seed={(flow.creator as any).avatar_seed} size={16} />
                        <span>{(flow.creator as any).username}</span>
                      </div>
                    )}
                    <span className="shrink-0">{new Date(flow.created_at).toLocaleDateString()}</span>
                    <span className="shrink-0">{flow.run_count} runs</span>
                    <span className="shrink-0">{flow.completion_count} wins</span>
                    <span className="shrink-0">{flow.like_count} likes</span>
                    <span className="shrink-0">{flow.fork_count} forks</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col items-center justify-start lg:items-end gap-2 flex-shrink-0 flex-wrap shrink-0 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[var(--border)]">
                   <div className="flex gap-2 w-full lg:w-auto">
                    {flow.status !== 'verified' && (
                      <button
                        onClick={() => updateFlowStatus(flow.id, 'verified')}
                        disabled={actionLoading !== null}
                        className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 px-4 py-2 text-[11px] uppercase tracking-widest font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-xl hover:bg-[var(--accent)] hover:text-white transition-all disabled:opacity-50 press-scale"
                        title="Mark as verified"
                      >
                        {actionLoading === flow.id + 'verified' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Verify
                      </button>
                    )}

                    {flow.status !== 'unverified' && (
                      <button
                        onClick={() => updateFlowStatus(flow.id, 'unverified')}
                        disabled={actionLoading !== null}
                        className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 px-4 py-2 text-[11px] uppercase tracking-widest font-bold bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)] rounded-xl hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-amber-950/20 dark:hover:text-amber-400 transition-all disabled:opacity-50 press-scale"
                        title="Revert to unverified"
                      >
                        {actionLoading === flow.id + 'unverified' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Unverify
                      </button>
                    )}
                   </div>

                  <div className="flex gap-2 w-full lg:w-auto">
                     <Link
                      href={`/flow/${flow.id}`}
                      target="_blank"
                      className="flex-1 lg:flex-none flex justify-center items-center px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all press-scale"
                      title="View flow"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => deleteFlow(flow.id, flow.title)}
                      disabled={actionLoading !== null}
                      className="flex-1 lg:flex-none flex justify-center items-center px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-tertiary)] hover:text-[var(--risky)] hover:border-red-200 dark:hover:border-red-900 transition-all disabled:opacity-50 press-scale"
                      title="Delete flow"
                    >
                      {actionLoading === flow.id + 'delete' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
