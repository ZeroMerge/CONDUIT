"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from './avatar'

export function Nav() {
  const { profile, clearUser } = useUserStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearUser()
    router.push('/auth/signin')
  }

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border)] h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[var(--accent)] rounded flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="font-bold text-lg tracking-tight">Conduit</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Explore
          </div>
          {profile && (
            <Link href="/create" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Create Flow
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {profile ? (
          <div className="flex items-center gap-6">
            {profile.is_admin && (
              <Link href="/admin" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Admin
              </Link>
            )}
            
            <div className="group relative py-2"> {/* Added py-2 for bridge */}
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar seed={profile.avatar_seed} size={32} />
                <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:block">
                  {profile.username}
                </span>
              </div>
              
              {/* Dropdown - positioned at top-full without margin to prevent hover loss */}
              <div className="absolute top-full right-0 w-48 bg-[var(--bg-primary)] border border-[var(--border)] rounded shadow-lg py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
                <Link href={`/profile/${profile.username}`} className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                  My Profile
                </Link>
                <Link href="/settings" className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                  Settings
                </Link>
                <div className="border-t border-[var(--border)] my-1" />
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm font-medium px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded transition-colors">
              Create account
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}