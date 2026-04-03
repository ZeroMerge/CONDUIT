// src/app/admin/layout.tsx
// The middleware already protects this route, but we do a second server-side
// check here so the layout itself can pass the admin's profile to children.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Workflow, Users, ChevronLeft } from 'lucide-react'
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
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm sticky top-[var(--nav-height)] z-40">
        <ResponsiveContainer className="py-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" />
            Back to Conduit
          </Link>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-[var(--accent)]">Admin Panel</span>
        </ResponsiveContainer>
      </div>

      <ResponsiveContainer className="py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Top Nav for Mobile */}
          <aside className="w-full md:w-48 flex-shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide snap-x">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/admin' ? true : false; // Simplification for now
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap snap-child
                      text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:block mt-8 pt-6 border-t border-[var(--border)]">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-2">Authenticated</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{profile.username}</p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </ResponsiveContainer>
    </div>
  )
}
