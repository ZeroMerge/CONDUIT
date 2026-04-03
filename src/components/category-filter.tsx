"use client"

import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'All',
  'Marketing',
  'Sales',
  'Engineering',
  'Product',
  'Operations',
  'Design',
  'Personal'
]

export function CategoryFilter({ activeCategory = 'All' }: { activeCategory?: string }) {
  const router = useRouter()

  const handleCategoryClick = (category: string) => {
    const url = new URL(window.location.href)
    if (category.toLowerCase() === 'all') {
      url.searchParams.delete('category')
    } else {
      url.searchParams.set('category', category.toLowerCase())
    }
    router.push(url.pathname + url.search)
  }

  return (
    <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 scroll-fade-both sm:mask-image-none">
      <div className="flex gap-2.5 overflow-x-auto snap-x scrollbar-hide py-1 pb-2">
        {CATEGORIES.map((category) => {
          const isActive = 
            category.toLowerCase() === activeCategory.toLowerCase() || 
            (activeCategory === 'all' && category === 'All')

          return (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`
                snap-child flex-shrink-0
                px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 press-scale
                ${isActive 
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md' 
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {category}
            </button>
          )
        })}
      </div>
    </div>
  )
}
