"use client"

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
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
    <ResponsiveContainer narrow section="sm">
      <div className="max-w-[400px] mx-auto">
        <h1 className="text-xl font-geist font-semibold text-[var(--text-primary)] text-center mb-8">
          Sign in to Conduit
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm text-[var(--text-primary)] transition-colors duration-150 pr-10"
                placeholder="Your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded transition-colors duration-150"
          >
            {loading ? 'Signing in...' : 'Sign in \u2192'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
          <div className="relative flex justify-center text-xs"><span className="bg-[var(--bg-primary)] px-2 text-[var(--text-tertiary)]">Or continue with</span></div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
            className="w-full bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium py-2 rounded transition-colors duration-150"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
            className="w-full bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium py-2 rounded transition-colors duration-150"
          >
            Google
          </button>
        </div>

        <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-[var(--accent)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </ResponsiveContainer>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[var(--text-tertiary)]">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}