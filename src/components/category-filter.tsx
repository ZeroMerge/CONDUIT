// src/components/category-filter.tsx
'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface CategoryFilterProps {
  categories?: string[]
  activeCategory?: string | null
  onCategoryChange?: (category: string | null) => void
}

const DEFAULT_CATEGORIES = [
  'Marketing', 'Sales', 'Engineering', 'Product', 'Operations', 'Design', 'Personal'
]

export function CategoryFilter({
  categories = DEFAULT_CATEGORIES,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use either the passed prop or the URL search param
  const currentCategory = activeCategory !== undefined 
    ? activeCategory 
    : searchParams.get('category')

  const handleCategoryClick = (category: string | null) => {
    if (onCategoryChange) {
      onCategoryChange(category)
    } else {
      // Default behavior: navigate to explore with the category
      const params = new URLSearchParams(searchParams.toString())
      if (category) {
        params.set('category', category)
      } else {
        params.delete('category')
      }
      router.push(`/explore?${params.toString()}`)
    }
  }

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="flex overflow-x-auto scrollbar-hide snap-x p-[1px]">
        <div className="flex gap-2 items-center min-w-max">
          {/* ALL CATEGORY */}
          <button
            onClick={() => handleCategoryClick(null)}
            className={cn(
              "px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] border transition-all duration-150 rounded-[6px] snap-start mb-1",
              currentCategory === null || currentCategory === 'all'
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm"
                : "bg-transparent text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
            )}
          >
            All
          </button>

          {/* DYNAMIC CATEGORIES */}
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] border transition-all duration-150 rounded-[6px] snap-start mb-1",
                currentCategory?.toLowerCase() === category.toLowerCase()
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm"
                  : "bg-transparent text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Visual Fade Hint for Scroll */}
      <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-[var(--bg-primary)] to-transparent pointer-events-none opacity-50" />
    </div>
  )
}
