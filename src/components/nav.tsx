"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Zap, Flame, Menu, X,
  Home, Compass, Plus, User, Shield, LogOut,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from './avatar'
import { ThemeToggle } from './theme-toggle'
import { toast } from 'sonner'

// ── Shared nav links (used on desktop + in drawer) ──────────
const NAV_LINKS = [
  { href: '/',       label: 'Home',    icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/create',  label: 'Create',  icon: Plus },
]

export function Nav() {
  const router   = useRouter()
  const pathname = usePathname()
  const { profile, clear } = useUserStore()

  const [drawerOpen, setDrawerOpen] = useState(false)

  // Touch gesture tracking for swipe-right-to-close
  const touchStartX  = useRef<number | null>(null)
  const touchStartY  = useRef<number | null>(null)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Body scroll lock
  useEffect(() => {
    if (drawerOpen) {
      const sw = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.setProperty('--scrollbar-width', `${sw}px`)
      document.body.classList.add('scroll-locked')
    } else {
      document.body.classList.remove('scroll-locked')
    }
    return () => document.body.classList.remove('scroll-locked')
  }, [drawerOpen])

  // ── Event: Escape key closes drawer ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    if (drawerOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // ── Swipe gesture handlers ──
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    // Only register as horizontal swipe (not vertical scroll)
    if (dx > 60 && dy < 40) setDrawerOpen(false)
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clear()
      setDrawerOpen(false)
      router.push('/')
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          TOP NAV BAR
      ══════════════════════════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-sm"
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="page-container flex items-center justify-between h-full gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="font-geist font-bold text-[var(--text-primary)] flex items-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Zap className="h-[18px] w-[18px] text-[var(--accent)] fill-current" />
            Conduit
          </Link>

          {/* Desktop centre links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.slice(1).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`
                  text-sm px-3 py-1.5 rounded-lg transition-colors font-medium
                  ${isActive(href)
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            {/* ── Desktop auth ── */}
            <div className="hidden md:flex items-center gap-2">
              {profile ? (
                <div className="flex items-center gap-2">
                  {/* Streak badge */}
                  {profile.current_streak > 0 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      {profile.current_streak}
                    </div>
                  )}

                  {/* Avatar dropdown */}
                  <div className="group relative">
                    {/* Invisible padding to bridge hover gap */}
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity py-2">
                      <Avatar seed={profile.avatar_seed} size={32} />
                      <span className="text-sm font-medium text-[var(--text-primary)] hidden lg:block leading-none">
                        {profile.username}
                      </span>
                    </button>

                    {/* Dropdown panel */}
                    <div className="absolute right-0 top-full w-52 hidden group-hover:block animate-fade-up" style={{ paddingTop: '2px' }}>
                      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                        {/* User identity */}
                        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                          <p className="text-xs text-[var(--text-tertiary)]">Signed in as</p>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-0.5">{profile.username}</p>
                          <p className="text-xs text-[var(--accent)] font-medium">{profile.total_xp || 0} XP</p>
                        </div>
                        <Link href={`/profile/${profile.username}`} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                          <User className="h-4 w-4 text-[var(--text-tertiary)]" /> My Profile
                        </Link>
                        {profile.is_admin && (
                          <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-colors">
                            <Shield className="h-4 w-4" /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-[var(--border)]" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <LogOut className="h-4 w-4 text-[var(--text-tertiary)]" /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/signin" className="text-sm font-medium px-3 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-secondary)]">
                    Sign in
                  </Link>
                  <Link href="/auth/signup" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                    Get started
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile: avatar preview + hamburger ── */}
            {profile && (
              <button className="md:hidden p-1 flex-shrink-0" onClick={() => setDrawerOpen(true)}>
                <Avatar seed={profile.avatar_seed} size={28} />
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden touch-target rounded-xl hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              <Menu className="h-5 w-5 text-[var(--text-primary)]" />
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[59] bg-black/50 md:hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`
          fixed top-0 right-0 bottom-0 z-[60] md:hidden
          w-[min(320px,90vw)]
          flex flex-col
          bg-[var(--bg-primary)] border-l border-[var(--border)]
          shadow-2xl shadow-black/20
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--border)] flex-shrink-0">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="font-geist font-bold flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-[var(--accent)] fill-current" />
            Conduit
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="touch-target rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-[var(--text-primary)]" />
          </button>
        </div>

        {/* User card (authenticated) */}
        {profile && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Avatar seed={profile.avatar_seed} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{profile.username}</p>
                <p className="text-xs text-[var(--accent)] font-medium mt-0.5">{profile.total_xp || 0} XP earned</p>
              </div>
              {profile.current_streak > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 flex-shrink-0">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  {profile.current_streak}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                ${isActive(href)
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {label}
              {isActive(href) && <ChevronRight className="h-4 w-4 ml-auto opacity-40" />}
            </Link>
          ))}

          {/* Profile-specific links */}
          {profile && (
            <>
              <div className="h-px bg-[var(--border)] my-2" />
              <Link
                href={`/profile/${profile.username}`}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${pathname === `/profile/${profile.username}`
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                <User className="h-[18px] w-[18px] flex-shrink-0" />
                My Profile
              </Link>
              {profile.is_admin && (
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                >
                  <Shield className="h-[18px] w-[18px] flex-shrink-0" />
                  Admin Panel
                </Link>
              )}
            </>
          )}

          {/* Hint: swipe right to close */}
          <div className="flex items-center justify-center mt-8 gap-1.5">
            <div className="w-8 h-0.5 rounded-full bg-[var(--border)]" />
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Swipe right to close</p>
            <div className="w-8 h-0.5 rounded-full bg-[var(--border)]" />
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="px-4 pt-4 space-y-2 flex-shrink-0 border-t border-[var(--border)]">
          {profile ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] transition-colors press-scale"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <>
              <Link
                href="/auth/signup"
                onClick={() => setDrawerOpen(false)}
                className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors press-scale"
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="/auth/signin"
                onClick={() => setDrawerOpen(false)}
                className="block w-full py-3 rounded-xl text-sm font-medium text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}