"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { sanitizeUsername } from '@/lib/username'
import { toast } from 'sonner'
import { ResponsiveContainer } from '@/components/ui/responsive-container'

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

    const inputClassName = "w-full flex h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200"

    return (
        <ResponsiveContainer>
            <div className="max-w-[400px] w-full mx-auto px-4 py-12 md:py-24">
                <div className="text-center mb-10 fade-in animate-fade-down">
                    <h1 className="text-2xl md:text-3xl font-geist font-bold text-[var(--text-primary)]">Complete your profile</h1>
                    <p className="text-sm md:text-base text-[var(--text-secondary)] mt-2">Just two quick steps to get started.</p>
                </div>

                {step === 1 ? (
                    <div className="space-y-6 fade-in animate-fade-up">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[var(--text-primary)]">Choose your username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(sanitizeUsername(e.target.value))
                                        setUsernameStatus('idle')
                                    }}
                                    className={`${inputClassName} pr-12`}
                                    placeholder="cool_builder"
                                    maxLength={24}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {usernameStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />}
                                    {usernameStatus === 'available' && <Check className="h-5 w-5 text-[var(--verified)]" />}
                                    {usernameStatus === 'taken' && <X className="h-5 w-5 text-[var(--risky)]" />}
                                </div>
                            </div>
                            {usernameStatus === 'taken' && <p className="text-sm font-semibold text-[var(--risky)] pl-1">Username taken</p>}
                        </div>

                        <button
                            onClick={handleStep1Submit}
                            disabled={username.length < 3 || usernameStatus !== 'available'}
                            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold h-12 rounded-xl transition-all duration-200 shadow-md shadow-[var(--accent)]/10 press-scale disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            Continue &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 fade-in animate-fade-right">
                        <div className="text-center">
                            <p className="text-sm md:text-base font-semibold text-[var(--text-primary)] mb-6">Pick your robot avatar</p>
                            <div className="inline-flex rounded-2xl bg-[var(--accent)] p-1 shadow-lg shadow-[var(--accent)]/20 bounce-on-mount">
                                <Avatar seed={selectedAvatar} size={112} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            {avatarOptions.map((seed) => (
                                <button
                                    key={seed}
                                    onClick={() => setSelectedAvatar(seed)}
                                    className={`flex items-center justify-center p-2 aspect-square rounded-xl border-2 transition-all duration-200 press-scale ${selectedAvatar === seed ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]'
                                        }`}
                                >
                                    <Avatar seed={seed} size={64} />
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => {
                                    const options = Array.from({ length: 6 }, () => crypto.randomUUID())
                                    setAvatarOptions(options)
                                    setSelectedAvatar(options[0])
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] h-12 text-sm font-semibold rounded-xl transition-all duration-200 press-scale"
                            >
                                <RefreshCw className="h-4 w-4" /> Shuffle
                            </button>

                            <button
                                onClick={handleFinalSubmit}
                                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold h-14 rounded-xl transition-all duration-200 shadow-lg shadow-[var(--accent)]/10 press-scale"
                            >
                                Enter Conduit &rarr;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ResponsiveContainer>
    )
}