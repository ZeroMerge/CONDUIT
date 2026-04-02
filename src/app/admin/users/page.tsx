// src/app/admin/users/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { toast } from 'sonner'
import {
  Shield,
  ShieldOff,
  Search,
  RefreshCw,
  Flame,
  Trophy,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import type { Profile } from '@/types'

interface AdminProfile extends Profile {
  is_admin: boolean
  completion_count?: number
}

export default function AdminUsersPage() {
  const { profile: currentAdmin } = useUserStore()
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'xp' | 'streak'>('newest')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      let orderCol = 'created_at'
      if (sortBy === 'xp') orderCol = 'total_xp'
      if (sortBy === 'streak') orderCol = 'current_streak'

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order(orderCol, { ascending: false })

      if (error) throw error
      setUsers((data as AdminProfile[]) || [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [sortBy])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (userId === currentAdmin?.id) {
      toast.error("You can't remove your own admin status.")
      return
    }
    setActionLoading(userId + 'admin')
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, field: 'is_admin', value: !currentIsAdmin }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(currentIsAdmin ? 'Admin removed' : 'Admin granted')
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u
        )
      )
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.username.toLowerCase().includes(q) || (u.bio || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-geist font-bold text-[var(--text-primary)]">
            User Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {users.length} registered members
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 border border-[var(--border)] rounded"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {[
            { value: 'newest', label: 'Newest' },
            { value: 'xp', label: 'Top XP' },
            { value: 'streak', label: 'Top Streak' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as any)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sortBy === opt.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded outline-none focus:border-[var(--border-strong)]"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const hoursSaved = Math.round((user.total_time_saved_minutes || 0) / 60)
            const isSelf = user.id === currentAdmin?.id

            return (
              <div
                key={user.id}
                className={`bg-[var(--bg-secondary)] border rounded-lg p-4 flex items-center gap-4 ${
                  user.is_admin
                    ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {/* Avatar + Name */}
                <Avatar seed={user.avatar_seed} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {user.username}
                    </span>
                    {user.is_admin && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--accent-border)] px-2 py-0.5 rounded">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-xs text-[var(--text-tertiary)]">(you)</span>
                    )}
                  </div>
                  {user.bio && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate max-w-xs">
                      {user.bio}
                    </p>
                  )}
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-5 text-xs text-[var(--text-tertiary)] flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span className="font-medium text-[var(--text-primary)]">
                      {user.total_xp || 0}
                    </span>
                    <span>XP</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-medium text-[var(--text-primary)]">
                      {user.current_streak || 0}
                    </span>
                    <span>streak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-medium text-[var(--text-primary)]">{hoursSaved}h</span>
                    <span>saved</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/profile/${user.username}`}
                    target="_blank"
                    className="p-2 rounded border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                    title="View profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    disabled={actionLoading !== null || isSelf}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-40 ${
                      user.is_admin
                        ? 'border-[var(--border)] text-[var(--text-secondary)] hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400'
                        : 'border-[var(--accent-border)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-white'
                    }`}
                    title={user.is_admin ? 'Remove admin' : 'Grant admin'}
                  >
                    {actionLoading === user.id + 'admin' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : user.is_admin ? (
                      <>
                        <ShieldOff className="h-3 w-3" /> Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3" /> Make Admin
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
