"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { ReviewForm } from '@/components/review-form'
import type { Flow } from '@/types'

export default function CompleteFlowPage() {
  const params = useParams()
  const { profile } = useUserStore()
  const flowId = params.id as string

  const [flow, setFlow] = useState<Flow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const { data, error } = await supabase
          .from('flows')
          .select('*')
          .eq('id', flowId)
          .single()

        if (error) throw error
        setFlow(data)
      } catch (error) {
        console.error('Error fetching flow:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlow()
  }, [flowId])

  if (loading) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-[var(--bg-tertiary)] rounded-full mx-auto" />
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-1/2 mx-auto mt-6" />
        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4 mx-auto mt-2" />
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-16 text-center">
        <p className="text-[var(--text-tertiary)]">Flow not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-[560px] mx-auto px-6 py-16">
      <div className="text-center">
        <Check
          className="h-12 w-12 mx-auto"
          style={{ color: 'var(--accent)' }}
          strokeWidth={2}
        />
        <h1 className="text-2xl font-geist font-semibold text-[var(--text-primary)] mt-6">
          Flow complete.
        </h1>
        <p className="text-base text-[var(--text-secondary)] mt-2">
          &ldquo;{flow.title}&rdquo;
        </p>
      </div>

      {!profile ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-6 mt-8 text-center">
          <h2 className="text-base font-geist font-semibold text-[var(--text-primary)]">
            Sign in to save your completion
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Create a free account to track your progress and
            help the community with your review.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Link
              href="/auth/signup"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded transition-colors duration-150"
            >
              Create account
            </Link>
            <Link
              href="/auth/signin"
              className="bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium px-4 py-2 rounded transition-colors duration-150"
            >
              Sign in
            </Link>
          </div>
          <Link
            href="/explore"
            className="mt-4 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-150 block"
          >
            Continue to explore &rarr;
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <ReviewForm flowId={flowId} flowTitle={flow.title} />
        </div>
      )}
    </div>
  )
}
