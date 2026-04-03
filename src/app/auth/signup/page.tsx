"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Check, X, RefreshCw, Github } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { AvatarColorPicker } from '@/components/avatar-color-picker'
import { sanitizeUsername } from '@/lib/username'
import { toast } from 'sonner'
import { ResponsiveContainer } from '@/components/ui/responsive-container'

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

  // Step 2 fields
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

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
    if (pwd.length === 0) return { strength: 'weak', color: 'text-transparent' }
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
        <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]' : 'border border-[var(--border)]'}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Account</span>
      </div>
      <div className="w-8 h-px bg-[var(--border)]" />
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]' : 'border border-[var(--border)]'}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Username</span>
      </div>
      <div className="w-8 h-px bg-[var(--border)]" />
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]' : 'border border-[var(--border)]'}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Avatar</span>
      </div>
    </div>
  )

  const inputClassName = "w-full flex h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"
  
  return (
    <ResponsiveContainer>
      <div className="max-w-[400px] w-full mx-auto px-4 py-8 md:py-16 fade-in animate-fade-up">
        {renderProgress()}
        
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-geist font-bold text-center text-[var(--text-primary)]">Create your account</h1>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)]">Password</label>
                  {password.length > 0 && (
                     <span className={`text-xs font-semibold ${passwordStrength.color} capitalize`}>{passwordStrength.strength}</span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClassName}
                  placeholder="Password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClassName}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              onClick={handleStep1Submit}
              disabled={isSubmitting || !email || password.length < 8 || password !== confirmPassword}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {isSubmitting ? 'Creating account...' : 'Continue \u2192'}
            </button>

            {/* SOCIAL LOGIN OPTIONS */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
              <div className="relative flex justify-center text-xs"><span className="bg-[var(--bg-primary)] px-3 text-[var(--text-tertiary)] font-medium">OR CONTINUE WITH</span></div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => supabase.auth.signInWithOAuth({
                  provider: 'github',
                  options: { redirectTo: `${window.location.origin}/auth/callback` }
                })}
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] text-[var(--text-primary)] h-12 text-sm font-semibold rounded-xl transition-all duration-200 press-scale shadow-sm shadow-black/[0.02]"
              >
                <Github className="h-5 w-5" /> GitHub
              </button>
              <button
                type="button"
                onClick={() => supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/auth/callback` }
                })}
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] text-[var(--text-primary)] h-12 text-sm font-semibold rounded-xl transition-all duration-200 press-scale shadow-sm shadow-black/[0.02]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>

            <p className="text-sm text-center text-[var(--text-secondary)] font-medium mt-6">
              Already have an account? <Link href="/auth/signin" className="text-[var(--accent)] hover:underline font-bold">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 fade-in animate-fade-right">
            <h1 className="text-2xl md:text-3xl font-geist font-bold text-center text-[var(--text-primary)]">Choose your username</h1>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                className={`${inputClassName} pr-12`}
                placeholder="username"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />}
                {usernameStatus === 'available' && <Check className="h-5 w-5 text-[var(--verified)]" />}
                {usernameStatus === 'taken' && <X className="h-5 w-5 text-[var(--risky)]" />}
              </div>
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={usernameStatus !== 'available'}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 fade-in animate-fade-right">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-geist font-bold text-[var(--text-primary)]">Pick your robot</h1>
              <p className="text-sm md:text-base text-[var(--text-tertiary)] mt-2">Select a base bot and customize the fill.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {avatarOptions.map(seed => (
                <button
                  key={seed}
                  onClick={() => setSelectedAvatar(seed)}
                  className={`flex items-center justify-center aspect-square rounded-2xl border-2 transition-all duration-200 press-scale ${selectedAvatar === seed ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm shadow-[var(--accent)]/20' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]'}`}
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
              className="flex items-center justify-center gap-2 w-full h-10 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Shuffle Robots
            </button>

            <div className="pt-6 border-t border-[var(--border)]">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4 text-center">Background Fill</p>
              <div className="flex justify-center">
                <AvatarColorPicker 
                  currentValue={selectedColor} 
                  onSelect={setSelectedColor} 
                />
              </div>
            </div>

            <button
              onClick={handleStep3Submit}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold h-14 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale mt-4 text-base"
            >
              Enter Conduit &rarr;
            </button>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-[var(--text-tertiary)]"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <SignUpContent />
    </Suspense>
  )
}