"use client"

import { useState } from 'react'
import { Check } from 'lucide-react'

const AVATAR_COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'Midnight', value: '#1e293b' },
  { name: 'Candy', value: '#e11d48' },
  { name: 'Ocean', value: '#2563eb' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Coal', value: '#09090b' },
]

interface AvatarColorPickerProps {
  onSelect: (color: string) => void
  currentValue?: string | null
}

export function AvatarColorPicker({ onSelect, currentValue = 'transparent' }: AvatarColorPickerProps) {
  const [selected, setSelected] = useState(currentValue || 'transparent')

  const handleSelect = (color: string) => {
    setSelected(color)
    onSelect(color)
  }

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {AVATAR_COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => handleSelect(color.value)}
          className={`group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
            selected === color.value 
            ? 'border-[var(--accent)]' 
            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
          type="button"
        >
          {selected === color.value && (
            <div className="flex items-center justify-center rounded-full bg-[var(--accent)] p-0.5 text-white shadow-sm ring-2 ring-white">
              <Check className="h-3 w-3" />
            </div>
          )}
          {color.value === 'transparent' && selected !== color.value && (
            <div className="h-full w-full rounded-full bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:8px_8px]" />
          )}
        </button>
      ))}
    </div>
  )
}
