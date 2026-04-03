// src/app/admin/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/avatar'
import {
  Users,
  Workflow,
  CheckCircle,
  Heart,
  Clock,
  TrendingUp,
  AlertCircle,
  Star,
} from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  sub?: string
  accent?: boolean
}

function StatCard({ label, value, icon: Icon, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)]' : 'bg-[var(--bg-secondary)] border-[var(--border)]'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`} />
      </div>
      <p className="text-3xl font-geist font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  // --- Platform Counts ---
  const [
    { count: totalFlows },
    { count: totalUsers },
    { count: totalCompletions },
    { count: pendingFlows },
    { count: verifiedFlows },
  ] = await Promise.all([
    supabase.from('flows').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('completions').select('*', { count: 'exact', head: true }),
    supabase.from('flows').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('flows').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
  ])

  // --- Aggregate XP & Time Saved ---
  const { data: profileAgg } = await supabase
    .from('profiles')
    .select('total_xp, total_time_saved_minutes')

  const totalXp = profileAgg?.reduce((sum, p) => sum + (p.total_xp || 0), 0) ?? 0
  const totalHoursSaved = Math.round(
    (profileAgg?.reduce((sum, p) => sum + (p.total_time_saved_minutes || 0), 0) ?? 0) / 60
  )

  // --- Recent Completions ---
  const { data: recentCompletions } = await supabase
    .from('completions')
    .select('*, profile:profiles(username, avatar_seed), flow:flows(title)')
    .order('completed_at', { ascending: false })
    .limit(8)

  // --- Flows Pending Verification ---
  const { data: pendingFlowList } = await supabase
    .from('flows')
    .select('*, creator:profiles(username, avatar_seed)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  // --- Top Flows ---
  const { data: topFlows } = await supabase
    .from('flows')
    .select('id, title, completion_count, like_count, status')
    .order('completion_count', { ascending: false })
    .limit(5)

  // --- Newest Users ---
  const { data: newUsers } = await supabase
    .from('profiles')
    .select('id, username, avatar_seed, total_xp, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const completionRate =
    (totalFlows ?? 0) > 0
      ? Math.round(((totalCompletions ?? 0) / Math.max(totalFlows ?? 1, 1)) * 10) / 10
      : 0

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-geist font-bold text-[var(--text-primary)]">Platform Overview</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Real-time health metrics and moderation queue
        </p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Flows" value={totalFlows ?? 0} icon={Workflow} />
        <StatCard label="Members" value={totalUsers ?? 0} icon={Users} />
        <StatCard label="Completions" value={totalCompletions ?? 0} icon={CheckCircle} accent />
        <StatCard label="Pending Review" value={pendingFlows ?? 0} icon={Clock}
          sub={pendingFlows ? 'Needs action' : 'All clear'} />
        <StatCard label="Verified Flows" value={verifiedFlows ?? 0} icon={Star} />
        <StatCard label="Completions/Flow" value={completionRate} icon={TrendingUp} />
        <StatCard label="Total XP Earned" value={totalXp.toLocaleString()} icon={Star} />
        <StatCard label="Hours Saved" value={`${totalHoursSaved.toLocaleString()}h`} icon={TrendingUp} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Verification Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Pending Verification
            </h2>
            <Link
              href="/admin/flows?filter=pending"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          {pendingFlowList && pendingFlowList.length > 0 ? (
            <div className="space-y-3">
              {pendingFlowList.map((flow: any) => (
                <div
                  key={flow.id}
                  className="flex items-start justify-between gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <AlertCircle className="h-4 w-4 text-[var(--pending)] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {flow.title}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        by {flow.creator?.username || 'unknown'} &middot;{' '}
                        {flow.category}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/flows?flowId=${flow.id}`}
                    className="flex-shrink-0 text-xs bg-[var(--accent)] text-white px-3 py-1.5 rounded hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
              <CheckCircle className="h-8 w-8 text-[var(--verified)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">Queue is empty — all flows reviewed.</p>
            </div>
          )}
        </div>

        {/* Top Flows */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Top Flows
            </h2>
            <Link href="/admin/flows" className="text-xs text-[var(--accent)] hover:underline">
              Manage &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {topFlows?.map((flow: any, i: number) => (
              <div
                key={flow.id}
                className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3"
              >
                <span className="w-5 text-xs font-bold text-[var(--text-tertiary)]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {flow.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {flow.completion_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {flow.like_count}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      flow.status === 'verified'
                        ? 'text-[var(--verified)] bg-[var(--accent-subtle)]'
                        : flow.status === 'pending'
                        ? 'text-[var(--pending)] bg-amber-50 dark:bg-amber-950/20'
                        : 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {flow.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Newest Users */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Newest Members
            </h2>
            <Link href="/admin/users" className="text-xs text-[var(--accent)] hover:underline">
              Manage &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {newUsers?.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3"
              >
                <Avatar seed={u.avatar_seed} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {u.username}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--accent)]">
                  {u.total_xp || 0} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Recent Completions
          </h2>
          <div className="space-y-2">
            {recentCompletions?.map((c: any) => (
              <div
                key={c.id}
                className="flex items-start gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3"
              >
                {c.profile && <Avatar seed={c.profile.avatar_seed} size={28} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    <span className="font-medium">{c.profile?.username}</span>
                    {' '}completed{' '}
                    <span className="text-[var(--text-secondary)]">&ldquo;{c.flow?.title}&rdquo;</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span
                      className={c.success ? 'text-[var(--verified)]' : 'text-[var(--risky)]'}
                    >
                      {c.success ? '✓ Success' : '✗ Failed'}
                    </span>
                    <span className="text-[var(--text-tertiary)]">
                      {new Date(c.completed_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
