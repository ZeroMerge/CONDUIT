// src/app/admin/layout.tsx
// The middleware already protects this route, but we do a second server-side
// check here so the layout itself can pass the admin's profile to children.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Workflow, Users, ChevronRight } from 'lucide-react'
import { ResponsiveContainer } from '@/components/ui/responsive-container'

export const metadata = { title: 'Admin — Conduit' }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const navLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/flows', label: 'Flows', icon: Workflow },
    { href: '/admin/users', label: 'Users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Admin sub-nav bar */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl sticky top-14 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            Conduit
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[var(--accent)]">Admin</span>
        </div>
      </div>

      <ResponsiveContainer>
        <div className="flex flex-col md:flex-row gap-8 py-6 md:py-8 lg:py-12">
          {/* Sidebar */}
          <aside className="w-full md:w-48 lg:w-56 flex-shrink-0">
            <p className="hidden md:block text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 pl-3">
              Dashboard
            </p>
            {/* Mobile: Horizontal scroll nav, Desktop: Vertical stack */}
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-4 md:px-3 py-2.5 md:py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] md:bg-transparent border border-[var(--border)] md:border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap snap-start press-scale"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:block mt-8 pt-6 border-t border-[var(--border)] pl-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-2">Admin Profile</p>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-primary)] truncate">{profile.username}</span>
                <span className="text-xs text-[var(--accent)]">Level {Math.floor((profile.total_xp || 0) / 1000) + 1}</span>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
        </div>
      </ResponsiveContainer>
    </div>
  )
}
