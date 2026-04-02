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
      setUser(user)

      const isAuthPage = pathname?.startsWith('/auth/signin') || pathname?.startsWith('/auth/signup')
      const isOnboardingPage = pathname === '/auth/onboarding'
      const isAdminPage = pathname?.startsWith('/admin')
      const isCreatePage = pathname?.startsWith('/create')
      
      // Protected routes that REQUIRE a session
      const isProtectedRoute = isAdminPage || isCreatePage || isOnboardingPage

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setProfile(profile)
          // If on onboarding but profile exists, go home
          if (isOnboardingPage) {
            router.push('/')
          }
        } else {
          setProfile(null)
          // Profile missing -> must onboard (unless it's a guest-only page which shouldn't happen if user exists)
          if (!isOnboardingPage && !isAuthPage) {
            router.push('/auth/onboarding')
          }
        }
      } else {
        setUser(null)
        setProfile(null)

        // Redirect to signin if session is missing on a protected route
        // We also check for SIGNED_OUT event to handle explicit logout
        if (isProtectedRoute || event === 'SIGNED_OUT') {
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
      console.log('AUTH_EVENT:', event)
      handleAuth(session?.user, event)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, pathname, router])

  return <>{children}</>
}