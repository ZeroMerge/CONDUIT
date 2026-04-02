"use client"

import Link from 'next/link'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'React', label: 'React' },
  { value: 'Python', label: 'Python' },
  { value: 'Automation', label: 'Automation' },
  { value: 'AI Agents', label: 'AI Agents' },
  { value: 'APIs', label: 'APIs' },
  { value: 'Data', label: 'Data' },
]

interface CategoryFilterProps {
  activeCategory?: string
}

export function CategoryFilter({ activeCategory = 'all' }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Link
          key={category.value}
          href={category.value === 'all' ? '/explore' : `/explore?category=${category.value}`}
          className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded border transition-colors duration-150 ${
            activeCategory === category.value
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
          }`}
        >
          {category.label}
        </Link>
      ))}
    </div>
  )
}
