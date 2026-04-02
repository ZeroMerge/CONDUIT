"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleAuth = async (user: any) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setProfile(profile)
          // If they have a profile but are stuck on the onboarding page, send them home
          if (pathname === '/auth/onboarding') {
            router.push('/')
          }
        } else {
          // If they are logged in but have NO profile, force them to onboarding
          setProfile(null)
          if (pathname !== '/auth/onboarding') {
            router.push('/auth/onboarding')
          }
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    }

    // 1. Initial check on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session?.user)
    })

    // 2. Listen for login/logout events (like returning from Google OAuth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        router.push('/auth/signin')
      } else {
        handleAuth(session?.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, pathname, router])

  return <>{children}</>
}