"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface CategoryFilterProps {
  activeCategory?: string
}

export function CategoryFilter({ activeCategory = 'all' }: CategoryFilterProps) {
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All' },
  ])

  useEffect(() => {
    const fetchCategories = async () => {
      // Fetch unique categories from the flows table
      const { data, error } = await supabase
        .from('flows')
        .select('category')
        .neq('category', '')
      
      if (!error && data) {
        const uniqueCategories = Array.from(new Set(data.map(d => d.category)))
          .filter(Boolean)
          .sort()

        setCategories([
          { value: 'all', label: 'All' },
          ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
        ])
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
      {categories.map((category) => (
        <Link
          key={category.value}
          href={category.value === 'all' ? '/explore' : `/explore?category=${category.value}`}
          className={`flex-shrink-0 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-200 ${
            activeCategory === category.value
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent-subtle)]'
              : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
          }`}
        >
          {category.label}
        </Link>
      ))}
    </div>
  )
}
