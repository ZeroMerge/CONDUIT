"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

const COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'Emerald', value: '10b981' },
  { name: 'Blue', value: '3b82f6' },
  { name: 'Purple', value: 'a855f7' },
  { name: 'Rose', value: 'f43f5e' },
  { name: 'Amber', value: 'f59e0b' },
  { name: 'Slate', value: '64748b' },
]

export function AvatarColorPicker({ currentBackgroundColor, profileId }: { currentBackgroundColor?: string; profileId: string }) {
  const [selected, setSelected] = useState(currentBackgroundColor || 'transparent')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSelect = async (color: string) => {
    setLoading(true)
    setSelected(color)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_bg_color: color })
        .eq('id', profileId)

      if (error) throw error
      toast.success('Avatar background updated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update avatar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Avatar Background</p>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => handleSelect(color.value)}
            disabled={loading}
            className={`w-6 h-6 rounded-full border transition-all ${
              selected === color.value ? 'ring-2 ring-[var(--accent)] ring-offset-2 scale-110' : 'border-[var(--border)] hover:scale-105'
            }`}
            style={{ 
              backgroundColor: color.value === 'transparent' ? 'transparent' : `#${color.value}`,
              backgroundImage: color.value === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
              backgroundSize: color.value === 'transparent' ? '8px 8px' : 'auto',
              backgroundPosition: color.value === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
            }}
            title={color.name}
          >
            {selected === color.value && (
              <Check className={`h-3 w-3 mx-auto ${color.value === 'transparent' ? 'text-black' : 'text-white'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
