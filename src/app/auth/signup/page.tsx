"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Check, X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { AvatarColorPicker } from '@/components/avatar-color-picker'
import { sanitizeUsername } from '@/lib/username'
import { toast } from 'sonner'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, setUser, setProfile } = useUserStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user && step === 1) {
      router.push('/')
    }
  }, [user, step, router])

  // Step 1 fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  // Step 2 fields
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameError, setUsernameError] = useState('')

  // Step 3 fields
  const [avatarOptions, setAvatarOptions] = useState<string[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedColor, setSelectedColor] = useState('transparent')

  // Initialize avatar options
  useEffect(() => {
    const options = Array.from({ length: 9 }, () => crypto.randomUUID())
    setAvatarOptions(options)
    setSelectedAvatar(options[0])
  }, [])

  // Password strength logic
  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'fair' | 'strong'; color: string } => {
    if (pwd.length < 8) return { strength: 'weak', color: 'text-[var(--risky)]' }
    const variety = [/[A-Z]/.test(pwd), /[a-z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length
    if (variety >= 3 && pwd.length >= 12) return { strength: 'strong', color: 'text-[var(--verified)]' }
    if (variety >= 2) return { strength: 'fair', color: 'text-[var(--pending)]' }
    return { strength: 'weak', color: 'text-[var(--risky)]' }
  }

  const passwordStrength = getPasswordStrength(password)

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    try {
      const { data } = await supabase.from('profiles').select('username').eq('username', value).single()
      setUsernameStatus(data ? 'taken' : 'available')
    } catch {
      setUsernameStatus('available')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (username.length >= 3) checkUsername(username) }, 400)
    return () => clearTimeout(timer)
  }, [username, checkUsername])

  const handleStep1Submit = async () => {
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.')
          router.push('/auth/signin')
          return
        }
        throw error
      }
      if (data.user) { 
        setUser(data.user)
        setStep(2) 
      }
    } catch (err: any) { 
      toast.error(err.message || 'Failed to create account') 
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep3Submit = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return toast.error('Session expired. Please start over.')

    try {
      // Create profile in database
      const { error } = await supabase.from('profiles').insert([{
        id: user.id,
        username: username.toLowerCase(),
        avatar_seed: selectedAvatar,
        avatar_bg_color: selectedColor,
      }] as any)
      if (error) throw error

      // Initialize local state
      setProfile({
        id: user.id,
        username: username.toLowerCase(),
        avatar_seed: selectedAvatar,
        avatar_bg_color: selectedColor,
        bio: null,
        created_at: new Date().toISOString(),
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
        total_time_saved_minutes: 0,
        total_xp: 0
      })

      toast.success(`Welcome to Conduit, ${username}!`)
      const redirectTo = searchParams.get('redirect') || '/'
      router.push(redirectTo)
    } catch (err: any) { toast.error(err.message || 'Failed to create profile') }
  }

  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-[var(--accent)]' : 'border border-[var(--border)]'}`} />
        <span className="text-sm text-[var(--text-secondary)]">Account</span>
      </div>
      <div className="w-8 h-px bg-[var(--border)]" />
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-[var(--accent)]' : 'border border-[var(--border)]'}`} />
        <span className="text-sm text-[var(--text-secondary)]">Username</span>
      </div>
      <div className="w-8 h-px bg-[var(--border)]" />
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-[var(--accent)]' : 'border border-[var(--border)]'}`} />
        <span className="text-sm text-[var(--text-secondary)]">Avatar</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-[400px] mx-auto px-6 py-12">
      {renderProgress()}
      {step === 1 && (
        <div className="space-y-6">
          <h1 className="text-xl font-geist font-semibold text-center text-[var(--text-primary)]">Create your account</h1>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:border-[var(--border-strong)] outline-none"
              placeholder="you@example.com"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:border-[var(--border-strong)] outline-none"
              placeholder="Password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:border-[var(--border-strong)] outline-none"
              placeholder="Confirm password"
            />
          </div>

          <button
            onClick={handleStep1Submit}
            disabled={isSubmitting || !email || password.length < 8 || password !== confirmPassword}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Creating account...' : 'Continue'} &rarr;
          </button>

          {/* SOCIAL LOGIN OPTIONS */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-primary)] px-2 text-[var(--text-tertiary)]">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'github',
                options: { redirectTo: `${window.location.origin}/auth/callback` }
              })}
              className="w-full bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium py-2 rounded transition-colors duration-150"
            >
              GitHub
            </button>
            <button
              type="button"
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` }
              })}
              className="w-full bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium py-2 rounded transition-colors duration-150"
            >
              Google
            </button>
          </div>

          <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
            Already have an account? <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">Sign in</Link>
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-xl font-geist font-semibold text-center text-[var(--text-primary)]">Choose your username</h1>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm pr-10 focus:border-[var(--border-strong)] outline-none"
              placeholder="username"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
              {usernameStatus === 'available' && <Check className="h-4 w-4 text-[var(--verified)]" />}
              {usernameStatus === 'taken' && <X className="h-4 w-4 text-[var(--risky)]" />}
            </div>
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={usernameStatus !== 'available'}
            className="w-full bg-[var(--accent)] text-white text-sm font-medium py-2 rounded disabled:opacity-50"
          >
            Continue &rarr;
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-geist font-semibold text-[var(--text-primary)]">Pick your robot</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Select a base bot and customize the fill.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {avatarOptions.map(seed => (
              <button
                key={seed}
                onClick={() => setSelectedAvatar(seed)}
                className={`p-2 rounded-xl border-2 transition-all ${selectedAvatar === seed ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}
              >
                <Avatar seed={seed} size={64} bg_color={selectedColor} />
              </button>
            ))}
          </div>

          <button 
            type="button"
            onClick={() => {
              const options = Array.from({ length: 9 }, () => crypto.randomUUID())
              setAvatarOptions(options)
              setSelectedAvatar(options[0])
            }}
            className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Shuffle Robots
          </button>

          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 text-center">Background Fill</p>
            <div className="flex justify-center">
              <AvatarColorPicker 
                currentValue={selectedColor} 
                onSelect={setSelectedColor} 
              />
            </div>
          </div>

          <button
            onClick={handleStep3Submit}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Enter Conduit &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[var(--text-tertiary)]">Preparing signup...</div>}>
      <SignUpContent />
    </Suspense>
  )
}