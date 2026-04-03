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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-geist font-bold text-[var(--text-primary)]">
            Flow Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {flows.length} flows total
          </p>
        </div>
        <button
          onClick={fetchFlows}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 border border-[var(--border)] rounded"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-hide">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border-2 ${
                filter === opt.value
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md'
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search flows, creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded outline-none focus:border-[var(--border-strong)]"
          />
        </div>
      </div>

      {/* Flow Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-tertiary)] text-sm">
          No flows found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((flow) => (
            <div
              key={flow.id}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5"
            >
              <div className="flex items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                      {flow.title}
                    </h3>
                    <TrustBadge status={flow.status} size="sm" />
                    <span className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
                      {flow.category}
                    </span>
                    {flow.parent_flow_id && (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <GitFork className="h-3 w-3" /> Fork
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {flow.description}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
                    {(flow.creator as any) && (
                      <div className="flex items-center gap-1.5">
                        <Avatar seed={(flow.creator as any).avatar_seed} size={16} />
                        <span>{(flow.creator as any).username}</span>
                      </div>
                    )}
                    <span>{new Date(flow.created_at).toLocaleDateString()}</span>
                    <span>{flow.run_count} runs</span>
                    <span>{flow.completion_count} completions</span>
                    <span>{flow.like_count} likes</span>
                    <span>{flow.fork_count} forks</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-[var(--border)] mt-4 sm:mt-0">
                  <Link
                    href={`/flow/${flow.id}`}
                    target="_blank"
                    className="p-2 rounded border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                    title="View flow"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>

                  {flow.status !== 'verified' && (
                    <button
                      onClick={() => updateFlowStatus(flow.id, 'verified')}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] rounded hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
                      title="Mark as verified"
                    >
                      {actionLoading === flow.id + 'verified' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      Verify
                    </button>
                  )}

                  {flow.status !== 'unverified' && (
                    <button
                      onClick={() => updateFlowStatus(flow.id, 'unverified')}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)] rounded hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-amber-950/20 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
                      title="Revert to unverified"
                    >
                      {actionLoading === flow.id + 'unverified' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Unverify
                    </button>
                  )}

                  <button
                    onClick={() => deleteFlow(flow.id, flow.title)}
                    disabled={actionLoading !== null}
                    className="p-1.5 rounded border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--risky)] hover:border-red-200 dark:hover:border-red-900 transition-colors disabled:opacity-50"
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
          ))}
        </div>
      )}
    </div>
  )
}
