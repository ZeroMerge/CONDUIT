"use client"

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Github } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { toast } from 'sonner'
import { ResponsiveContainer } from '@/components/ui/responsive-container'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setProfile } = useUserStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        toast.error('Invalid email or password')
        return
      }

      if (data.user) {
        setUser(data.user)

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          setProfile(profile)
        }

        // Redirect to previous page or home
        const redirectTo = searchParams.get('redirect') || '/'
        router.push(redirectTo)
      }
    } catch {
      toast.error('Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveContainer>
      <div className="max-w-[400px] w-full mx-auto px-4 py-8 md:py-16 fade-in animate-fade-up">
        <h1 className="text-2xl md:text-3xl font-geist font-bold text-[var(--text-primary)] text-center mb-8">
          Welcome back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full flex h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full flex h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 pr-12"
                placeholder="Your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150 rounded-lg hover:bg-[var(--border)]"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in \u2192'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
          <div className="relative flex justify-center text-xs"><span className="bg-[var(--bg-primary)] px-3 text-[var(--text-tertiary)] font-medium">OR CONTINUE WITH</span></div>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] text-[var(--text-primary)] h-12 text-sm font-semibold rounded-xl transition-all duration-200 press-scale shadow-sm shadow-black/[0.02]"
          >
            <Github className="h-5 w-5" /> GitHub
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] text-[var(--text-primary)] h-12 text-sm font-semibold rounded-xl transition-all duration-200 press-scale shadow-sm shadow-black/[0.02]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
        </div>

        <p className="text-sm text-center text-[var(--text-secondary)] font-medium">
          New to Conduit?{' '}
          <Link href="/auth/signup" className="text-[var(--accent)] hover:underline font-bold">
            Create an account
          </Link>
        </p>
      </div>
    </ResponsiveContainer>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-[var(--text-tertiary)]">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}