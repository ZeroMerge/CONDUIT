"use client"

import { useState } from 'react'
import { GitFork, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores/user'
import { AuthModal } from './auth-modal'
import { toast } from 'sonner'

export function ForkButton({ flowId }: { flowId: string }) {
    const router = useRouter()
    const { user } = useUserStore()
    const [loading, setLoading] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)

    const handleFork = async () => {
        if (!user) {
            setShowAuthModal(true)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/flow/fork', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flowId })
            })

            if (!res.ok) throw new Error('Failed to fork')

            const { newFlowId } = await res.json()
            toast.success('Flow forked successfully!')
            router.push(`/flow/${newFlowId}`)
        } catch (error) {
            toast.error('Something went wrong. Could not fork flow.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={handleFork}
                disabled={loading}
                className="flex items-center gap-2 bg-transparent border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium px-4 py-3 rounded transition-colors duration-150 disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}
                {loading ? 'Forking...' : 'Fork Flow'}
            </button>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} trigger="create" />
        </>
    )
}