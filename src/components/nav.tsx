"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from './avatar'
import { ThemeToggle } from './theme-toggle'
import { toast } from 'sonner'

export function Nav() {
  const router = useRouter()
  const { profile, clear } = useUserStore()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clear()
      router.push('/')
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between h-full">
        <Link href="/" className="font-geist font-semibold text-base text-[var(--text-primary)]">
          Conduit
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/explore" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Explore
          </Link>
          <Link href="/create" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Create
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {profile ? (
            <div className="flex items-center gap-3">
              {/* STREAK BADGE */}
              {profile.current_streak > 0 && (
                <div className="flex items-center gap-1 text-sm font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                  <Flame className="h-4 w-4 fill-current" />
                  {profile.current_streak}
                </div>
              )}

              {/* USER DROPDOWN WITH INVISIBLE BRIDGE */}
              <div className="group relative py-2"> {/* Added py-2 for bridge */}
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar seed={profile.avatar_seed} size={32} />
                  <span className="text-sm text-[var(--text-primary)] hidden sm:block">
                    {profile.username}
                  </span>
                </button>

                {/* Positioned at top-full without margin to prevent hover loss */}
                <div className="absolute right-0 top-full pt-1 w-40 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded shadow-xl overflow-hidden">
                    <Link
                      href={`/profile/${profile.username}`}
                      className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    >
                      Profile
                    </Link>
                    {profile.is_admin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--bg-secondary)]"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className="text-sm font-medium px-4 py-2 text-[var(--text-primary)]">
                Sign in
              </Link>
              <Link href="/auth/signup" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded transition-colors">
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}