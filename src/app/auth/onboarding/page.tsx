"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { sanitizeUsername } from '@/lib/username'
import { toast } from 'sonner'

export default function OnboardingPage() {
    const router = useRouter()
    const { user, setProfile } = useUserStore()
    const [step, setStep] = useState<1 | 2>(1)

    // Username fields
    const [username, setUsername] = useState('')
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [usernameError, setUsernameError] = useState('')

    // Avatar fields
    const [avatarOptions, setAvatarOptions] = useState<string[]>([])
    const [selectedAvatar, setSelectedAvatar] = useState('')

    useEffect(() => {
        const options = Array.from({ length: 6 }, () => crypto.randomUUID())
        setAvatarOptions(options)
        setSelectedAvatar(options[0])
    }, [])

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
        const timer = setTimeout(() => {
            if (username.length >= 3) checkUsername(username)
        }, 400)
        return () => clearTimeout(timer)
    }, [username, checkUsername])

    const handleStep1Submit = () => {
        if (usernameStatus !== 'available') return
        setStep(2)
    }

    const handleFinalSubmit = async () => {
        if (!user) return toast.error('Session lost. Please refresh.')

        try {
            const newProfile = {
                id: user.id,
                username: username.toLowerCase(),
                avatar_seed: selectedAvatar,
            }

            const { error } = await supabase.from('profiles').insert([newProfile] as any)
            if (error) throw error

            setProfile({
                ...newProfile,
                full_name: null,
                bio: null,
                created_at: new Date().toISOString(),
                current_streak: 0,
                longest_streak: 0,
                last_completed_date: null,
                total_time_saved_minutes: 0,
                total_xp: 0
            })
            toast.success(`Welcome to Conduit, ${username}!`)
            router.push('/')
        } catch {
            toast.error('Failed to create profile')
        }
    }

    return (
        <div className="max-w-[400px] mx-auto px-6 py-16">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-geist font-semibold text-[var(--text-primary)]">Complete your profile</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Just two quick steps to get started.</p>
            </div>

            {step === 1 ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Choose your username</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(sanitizeUsername(e.target.value))
                                    setUsernameStatus('idle')
                                }}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--border-strong)] outline-none rounded px-3 py-2 text-sm transition-colors pr-10"
                                placeholder="cool_builder"
                                maxLength={24}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />}
                                {usernameStatus === 'available' && <Check className="h-4 w-4 text-[var(--verified)]" />}
                                {usernameStatus === 'taken' && <X className="h-4 w-4 text-[var(--risky)]" />}
                            </div>
                        </div>
                        {usernameStatus === 'taken' && <p className="text-sm text-[var(--risky)] mt-1">Username taken</p>}
                    </div>

                    <button
                        onClick={handleStep1Submit}
                        disabled={username.length < 3 || usernameStatus !== 'available'}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
                    >
                        Continue &rarr;
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center">
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-4">Pick your robot avatar</p>
                        <Avatar seed={selectedAvatar} size={96} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {avatarOptions.map((seed) => (
                            <button
                                key={seed}
                                onClick={() => setSelectedAvatar(seed)}
                                className={`p-2 rounded border-2 transition-colors ${selectedAvatar === seed ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] bg-[var(--bg-secondary)]'
                                    }`}
                            >
                                <Avatar seed={seed} size={64} />
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            const options = Array.from({ length: 6 }, () => crypto.randomUUID())
                            setAvatarOptions(options)
                            setSelectedAvatar(options[0])
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-transparent border border-[var(--border)] text-[var(--text-primary)] text-sm py-2 rounded"
                    >
                        <RefreshCw className="h-4 w-4" /> Regenerate
                    </button>

                    <button
                        onClick={handleFinalSubmit}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2 rounded transition-colors"
                    >
                        Enter Conduit &rarr;
                    </button>
                </div>
            )}
        </div>
    )
}