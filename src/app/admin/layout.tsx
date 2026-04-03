// src/app/admin/layout.tsx
// The middleware already protects this route, but we do a second server-side
// check here so the layout itself can pass the admin's profile to children.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Workflow, Users, ChevronRight } from 'lucide-react'

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
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            Conduit
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[var(--accent)]">Admin Panel</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
              Admin
            </p>
            <nav className="space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Signed in as admin</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{profile.username}</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
