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
    const handleAuth = async (user: any, event?: string) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setProfile(profile)
          if (pathname === '/auth/onboarding') {
            router.push('/')
          }
        } else {
          setProfile(null)
          if (pathname !== '/auth/onboarding') {
            router.push('/auth/onboarding')
          }
        }
      } else {
        setUser(null)
        setProfile(null)

        // Redirect to signin if session expires or user logs out on a protected route
        const isAuthPage = pathname?.startsWith('/auth')
        const isPublicPage = pathname === '/' || pathname === '/explore' || pathname === '/flows'
        
        if (!isAuthPage && !isPublicPage && (event === 'SIGNED_OUT' || event === 'USER_UPDATED')) {
          router.push('/auth/signin')
        }
      }
      setLoading(false)
    }

    // 1. Initial check on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session?.user)
    })

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuth(session?.user, event)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, pathname, router])

  return <>{children}</>
}