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
    <div className="space-y-6 fade-in animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-geist font-bold text-[var(--text-primary)]">
            User Management
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            {users.length} registered members
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors px-4 py-2 border border-[var(--border)] rounded-xl press-scale shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Database
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide snap-x px-1 -ml-1">
          {[
            { value: 'newest', label: 'Newest' },
            { value: 'xp', label: 'Top XP' },
            { value: 'streak', label: 'Top Streak' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as any)}
              className={`snap-start px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 press-scale ${
                sortBy === opt.value
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
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--accent)] transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
           <p className="text-[var(--text-tertiary)] text-sm font-medium">No users found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => {
            const hoursSaved = Math.round((user.total_time_saved_minutes || 0) / 60)
            const isSelf = user.id === currentAdmin?.id

            return (
              <div
                key={user.id}
                className={`bg-[var(--bg-secondary)] border rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-sm ${
                  user.is_admin
                    ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] hover:border-[var(--accent)]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left Identity Container */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <Avatar seed={user.avatar_seed} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-[var(--text-primary)] truncate">
                            @{user.username}
                          </span>
                          {user.is_admin && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-0.5 rounded-lg">
                              You
                            </span>
                          )}
                         </div>
                      </div>
                      
                      {/* Bio line if any */}
                      {user.bio ? (
                        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1 line-clamp-1 break-all md:break-normal">
                          {user.bio}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1 opacity-0 pointer-events-none h-5">
                            empty
                        </p>
                      )}

                    </div>
                  </div>

                  {/* Stats Ribbon */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold text-[var(--text-secondary)] rounded-xl mt-1 md:mt-0 px-1 -mx-1 shrink-0">
                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
                       <Trophy className="h-3.5 w-3.5 text-[var(--accent)]" /> <span>{user.total_xp || 0} XP</span>
                    </div>
                     <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
                       <Flame className="h-3.5 w-3.5 text-orange-500" /> <span>{user.current_streak || 0} Streak</span>
                    </div>
                     <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
                       <Clock className="h-3.5 w-3.5 text-blue-500" /> <span>{hoursSaved}h Saved</span>
                    </div>
                  </div>

                  {/* Actions Container */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <Link
                      href={`/profile/${user.username}`}
                      target="_blank"
                      className="flex-1 md:flex-none flex items-center justify-center px-4 md:px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all press-scale"
                      title="View profile"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      disabled={actionLoading !== null || isSelf}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest font-bold rounded-xl border transition-all disabled:opacity-40 press-scale ${
                        user.is_admin
                          ? 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400'
                          : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--text-primary)] hover:border-[var(--text-primary)] hover:text-[var(--bg-primary)]'
                      }`}
                      title={user.is_admin ? 'Remove admin' : 'Grant admin'}
                    >
                      {actionLoading === user.id + 'admin' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.is_admin ? (
                        <>
                          <ShieldOff className="h-3.5 w-3.5" /> Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="h-3.5 w-3.5" /> Make Admin
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
