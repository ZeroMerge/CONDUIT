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
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg ${accent ? 'bg-gradient-to-br from-[var(--accent)]/10 to-transparent border-[var(--accent)]/30 hover:border-[var(--accent)]' : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
        <div className={`p-2 rounded-xl ${accent ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl md:text-4xl font-geist font-black text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs font-medium text-[var(--text-secondary)] mt-2">{sub}</p>}
      {accent && <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--accent)] opacity-20 blur-2xl rounded-full pointer-events-none" />}
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
    <div className="space-y-10 fade-in animate-fade-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-geist font-bold text-[var(--text-primary)]">Platform Overview</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Real-time health metrics and moderation queue
        </p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Flows" value={totalFlows ?? 0} icon={Workflow} />
        <StatCard label="Members" value={totalUsers ?? 0} icon={Users} />
        <StatCard label="Completions" value={totalCompletions ?? 0} icon={CheckCircle} accent />
        <StatCard label="Pending Review" value={pendingFlows ?? 0} icon={Clock} sub={pendingFlows ? 'Needs action' : 'All clear'} />
        <StatCard label="Verified Flows" value={verifiedFlows ?? 0} icon={Star} />
        <StatCard label="Completions/Flow" value={completionRate} icon={TrendingUp} />
        <StatCard label="Total XP Earned" value={totalXp.toLocaleString()} icon={Star} />
        <StatCard label="Hours Saved" value={`${totalHoursSaved.toLocaleString()}h`} icon={TrendingUp} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* Pending Verification Queue */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Needs Verification
            </h2>
            <Link href="/admin/flows?filter=pending" className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              View all &rarr;
            </Link>
          </div>

          {pendingFlowList && pendingFlowList.length > 0 ? (
            <div className="space-y-3">
              {pendingFlowList.map((flow: any) => (
                <div key={flow.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all hover:border-[var(--border-strong)]">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 border border-[var(--pending)]/20 bg-orange-500/10 rounded-xl shrink-0 mt-0.5">
                      <AlertCircle className="h-4 w-4 text-[var(--pending)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {flow.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium truncate">
                        by {flow.creator?.username || 'unknown'} &middot; {flow.category}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/flows?flowId=${flow.id}`} className="flex-shrink-0 text-xs font-bold bg-[var(--accent)] text-white px-4 py-2 rounded-xl hover:bg-[var(--accent-hover)] transition-colors text-center w-full sm:w-auto press-scale shadow-sm shadow-[var(--accent)]/20">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-10 text-center flex flex-col items-center justify-center h-[200px]">
              <div className="w-12 h-12 rounded-full bg-[var(--verified)]/10 flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-[var(--verified)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Queue is empty</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">All flows have been reviewed.</p>
            </div>
          )}
        </div>

        {/* Top Flows */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Top Flows
            </h2>
            <Link href="/admin/flows" className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              Manage &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {topFlows?.map((flow: any, i: number) => (
              <div key={flow.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all hover:border-[var(--border-strong)]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--bg-primary)] text-xs font-bold text-[var(--text-tertiary)] border border-[var(--border)] shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {flow.title}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide text-xs font-semibold text-[var(--text-secondary)] flex-shrink-0 ml-9 sm:ml-0">
                  <span className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                    <CheckCircle className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {flow.completion_count}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> {flow.like_count}
                  </span>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      flow.status === 'verified'
                        ? 'text-[var(--verified)] bg-emerald-500/10 border border-emerald-500/20'
                        : flow.status === 'pending'
                        ? 'text-[var(--pending)] bg-orange-500/10 border border-orange-500/20'
                        : 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border)]'
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* Newest Users */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              Newest Members
            </h2>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              Manage &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {newUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all hover:border-[var(--border-strong)]">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar seed={u.avatar_seed} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      @{u.username}
                    </p>
                    <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-0.5">
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-[var(--accent)]/10 rounded-lg whitespace-nowrap">
                  <span className="text-xs font-bold text-[var(--accent)]">
                    {u.total_xp || 0} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-5">
            Real-time Activity
          </h2>
          <div className="space-y-3">
            {recentCompletions?.map((c: any) => (
              <div key={c.id} className="flex items-start gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all hover:border-[var(--border-strong)]">
                {c.profile && <div className="mt-0.5"><Avatar seed={c.profile.avatar_seed} size={32} /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-tight">
                    <span className="font-bold">@{c.profile?.username}</span>
                    {' '}completed{' '}
                    <span className="font-medium text-[var(--text-secondary)] whitespace-nowrap">&ldquo;{c.flow?.title}&rdquo;</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.success ? 'bg-[var(--verified)]/10 text-[var(--verified)]' : 'bg-[var(--risky)]/10 text-[var(--risky)]'}`}>
                      {c.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                      {new Date(c.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
