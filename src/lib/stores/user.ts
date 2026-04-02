"use client"

import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface UserStore {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  clear: () => set({ user: null, profile: null }),
}))
