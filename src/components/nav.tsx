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
  const [scrolled, setScrolled] = useState(false)

  // Touch gesture tracking for swipe-right-to-close
  const touchStartX  = useRef<number | null>(null)
  const touchStartY  = useRef<number | null>(null)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Track scroll for nav styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          TOP NAV BAR - Goldmine Design
      ══════════════════════════════════════════════════════ */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'glass bg-[var(--bg-primary)]/85 border-b border-[var(--border)] shadow-md shadow-black/5 dark:shadow-black/20' 
            : 'bg-[var(--bg-primary)] border-b border-transparent'
        }`}
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="page-container flex items-center justify-between h-full gap-4 relative">

          {/* Logo */}
          <Link
            href="/"
            className="font-geist font-black text-lg md:text-xl text-[var(--text-primary)] flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="bg-gradient-to-tr from-[var(--accent)] to-purple-500 rounded-lg p-1.5 shadow-sm shadow-[var(--accent)]/30">
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-white fill-current" />
            </div>
            <span className="tracking-tight">Conduit</span>
          </Link>

          {/* Desktop centre links */}
          <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.slice(1).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`
                  text-sm px-4 py-2 rounded-full transition-all font-semibold press-scale tracking-wide
                  ${isActive(href)
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md shadow-black/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* ── Desktop auth ── */}
            <div className="hidden md:flex items-center gap-3">
              {profile ? (
                <div className="flex items-center gap-2">
                  {/* Streak badge */}
                  {profile.current_streak > 0 && (
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-black text-orange-500 bg-orange-500/10 px-2.5 py-1.5 rounded-full border border-orange-500/20 shadow-sm shadow-orange-500/5 cursor-default">
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      {profile.current_streak}
                    </div>
                  )}

                  {/* Avatar dropdown */}
                  <div className="group relative">
                    {/* Invisible padding to bridge hover gap */}
                    <button className="flex items-center gap-2.5 hover:opacity-80 transition-opacity py-2 pl-2">
                      <div className="flex flex-col items-end hidden lg:flex">
                         <span className="text-sm font-bold text-[var(--text-primary)] leading-none mb-1">
                           {profile.username}
                         </span>
                         <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-widest leading-none">
                           {profile.total_xp || 0} XP
                         </span>
                      </div>
                      <Avatar seed={profile.avatar_seed} size={36} />
                    </button>

                    {/* Dropdown panel */}
                    <div className="absolute right-0 top-full w-56 hidden group-hover:block animate-fade-up z-50" style={{ paddingTop: '8px' }}>
                      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/10 overflow-hidden">
                        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                          <User className="h-4 w-4 text-[var(--text-tertiary)]" /> My Profile
                        </Link>
                        {profile.is_admin && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors">
                            <Shield className="h-4 w-4" /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-[var(--border)]" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--risky)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/signin" className="text-sm font-bold px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-xl hover:bg-[var(--bg-secondary)] press-scale">
                    Sign in
                  </Link>
                  <Link href="/auth/signup" className="bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 shadow-lg text-sm font-bold px-5 py-2 rounded-xl transition-all press-scale border border-transparent dark:border-white/10">
                    Get started
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile: avatar preview + hamburger ── */}
            {profile && (
              <button className="md:hidden p-0.5 flex-shrink-0" onClick={() => setDrawerOpen(true)}>
                <Avatar seed={profile.avatar_seed} size={32} />
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden touch-target rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0 active:scale-95"
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
        className={`fixed inset-0 z-[59] bg-[var(--bg-primary)]/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
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
          w-[min(320px,85vw)]
          flex flex-col
          bg-[var(--bg-primary)] border-l border-[var(--border)]
          shadow-2xl shadow-black/20
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--border)] flex-shrink-0 bg-[var(--bg-secondary)]/50">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="font-geist font-black text-lg flex items-center gap-2">
             <div className="bg-gradient-to-tr from-[var(--accent)] to-purple-500 rounded-md p-1 shadow-sm">
                <Zap className="h-3 w-3 text-white fill-current" />
             </div>
            Conduit
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="touch-target rounded-full bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm flex items-center justify-center active:scale-90 transition-all"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-[var(--text-primary)]" />
          </button>
        </div>

        {/* User card (authenticated) */}
        {profile && (
          <div className="mx-4 mt-5 p-4 rounded-2xl bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-3 relative">
              <Avatar seed={profile.avatar_seed} size={48} />
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-base font-bold text-[var(--text-primary)] truncate">{profile.username}</p>
                <div className="flex items-center gap-1 mt-1">
                   <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">{profile.total_xp || 0} XP</p>
                </div>
              </div>
              {profile.current_streak > 0 && (
                <div className="absolute -top-2 -right-2 flex flex-col items-center justify-center w-8 h-8 text-xs font-black text-orange-500 bg-orange-100 dark:bg-orange-950 rounded-full border border-orange-500/30 shadow-md transform rotate-12">
                  <Flame className="h-4 w-4 fill-current absolute opacity-20" />
                  <span className="relative z-10">{profile.current_streak}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 scrollbar-hide">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all press-scale
                  ${active
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md shadow-black/10'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border)]'
                  }
                `}
              >
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-inherit' : 'text-[var(--text-tertiary)]'}`} />
                {label}
                {active && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
              </Link>
            )
          })}

          {/* Profile-specific links */}
          {profile && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent my-6" />
              <Link
                href={`/profile/${profile.username}`}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all press-scale
                  ${pathname === `/profile/${profile.username}`
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border)]'
                  }
                `}
              >
                <User className="h-[18px] w-[18px] flex-shrink-0 text-[var(--text-tertiary)]" />
                My Profile
              </Link>
              {profile.is_admin && (
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 mt-2 rounded-xl text-sm font-bold text-[var(--accent)] bg-[var(--accent)]/5 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-all press-scale"
                >
                  <Shield className="h-[18px] w-[18px] flex-shrink-0" />
                  Admin Panel
                </Link>
              )}
            </>
          )}

          {/* Hint: swipe right to close */}
          <div className="flex items-center justify-center mt-10 gap-2 opacity-50">
            <div className="w-6 h-px bg-[var(--border-strong)]" />
            <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Swipe to close</p>
            <div className="w-6 h-px bg-[var(--border-strong)]" />
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="px-4 py-5 flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30">
          {profile ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:text-[var(--risky)] border border-[var(--border)] hover:border-red-200 transition-all press-scale shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <div className="space-y-3">
              <Link
                href="/auth/signup"
                onClick={() => setDrawerOpen(false)}
                className="block w-full py-4 rounded-xl text-sm font-black tracking-wide text-center bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all press-scale shadow-lg"
              >
                Get started today
              </Link>
              <Link
                href="/auth/signin"
                onClick={() => setDrawerOpen(false)}
                className="block w-full py-3.5 rounded-xl text-sm font-bold text-center text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all press-scale shadow-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}