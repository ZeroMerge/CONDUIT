"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from './avatar'
import { AuthModal } from './auth-modal'
import { MessageSquare, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { CommentWithProfile, Step } from '@/types'

export function CommentsSection({ flowId }: { flowId: string }) {
    const { user } = useUserStore()
    const [comments, setComments] = useState<CommentWithProfile[]>([])
    const [filterType, setFilterType] = useState<'all' | 'issue' | 'comment'>('all')
    const [steps, setSteps] = useState<Step[]>([])
    const [newComment, setNewComment] = useState('')
    const [postType, setPostType] = useState<'comment' | 'issue'>('comment')
    const [newTitle, setNewTitle] = useState('')
    const [selectedStepId, setSelectedStepId] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, profile:profiles(*)')
            .eq('flow_id', flowId)
            .order('created_at', { ascending: false })
        if (data) setComments(data as any[])
    }

    const fetchSteps = async () => {
        const { data } = await supabase.from('steps').select('*').eq('flow_id', flowId).order('order_index', { ascending: true })
        if (data) setSteps(data)
    }

    useEffect(() => {
        fetchComments()
        fetchSteps()
    }, [flowId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return setShowAuthModal(true)
        if (!newComment.trim()) return
        if (postType === 'issue' && !newTitle.trim()) return toast.error('Issue title is required')

        setLoading(true)
        try {
            const { error } = await supabase.from('comments').insert({
                flow_id: flowId,
                user_id: user.id,
                content: newComment.trim(),
                type: postType,
                title: postType === 'issue' ? newTitle.trim() : undefined,
                step_id: selectedStepId || undefined,
                status: postType === 'issue' ? 'open' : undefined
            })
            if (error) throw error
            setNewComment('')
            setNewTitle('')
            setSelectedStepId('')
            fetchComments()
            toast.success(postType === 'issue' ? 'Issue opened' : 'Comment posted')
        } catch {
            toast.error('Failed to post')
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (commentId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'open' ? 'closed' : 'open'
            await supabase.from('comments').update({ status: newStatus }).eq('id', commentId)
            setComments(comments.map(c => c.id === commentId ? { ...c, status: newStatus } : c))
        } catch {
            toast.error('Failed to update status')
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this?')) return
        if (!user?.id) return
        try {
            await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id)
            setComments(comments.filter(c => c.id !== commentId))
            toast.success('Deleted')
        } catch {
            toast.error('Failed to delete')
        }
    }

    const displayComments = comments.filter(c => filterType === 'all' ? true : c.type === (filterType === 'issue' ? 'issue' : 'comment') || (filterType === 'comment' && !c.type))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[var(--text-tertiary)]" />
                    <h2 className="text-lg font-geist font-semibold text-[var(--text-primary)]">Discussions & Issues</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-xs rounded-full ${filterType === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>All</button>
                    <button onClick={() => setFilterType('issue')} className={`px-3 py-1 text-xs rounded-full ${filterType === 'issue' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>Issues</button>
                    <button onClick={() => setFilterType('comment')} className={`px-3 py-1 text-xs rounded-full ${filterType === 'comment' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>Comments</button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4 bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border)]">
                {user ? <Avatar seed={useUserStore.getState().profile?.avatar_seed || ''} size={40} /> : <div className="w-10 h-10 rounded-full bg-[var(--border)]" />}
                <div className="flex-1 space-y-3 flex flex-col">
                    <div className="flex gap-2 mb-1">
                        <select
                            value={postType}
                            onChange={(e) => setPostType(e.target.value as 'comment' | 'issue')}
                            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text-primary)]"
                        >
                            <option value="comment">Comment</option>
                            <option value="issue">Issue</option>
                        </select>
                        {postType === 'issue' && (
                            <select
                                value={selectedStepId}
                                onChange={(e) => setSelectedStepId(e.target.value)}
                                className="bg-[var(--bg-primary)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text-primary)]"
                            >
                                <option value="">General Issue</option>
                                {steps.map((s, i) => (
                                    <option key={s.id} value={s.id}>Step {i + 1}: {s.title.slice(0, 15)}...</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {postType === 'issue' && (
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Issue Title..."
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm focus:border-[var(--border-strong)] outline-none"
                            required
                        />
                    )}

                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={postType === 'issue' ? "Describe the issue in detail..." : "Ask a question..."}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm resize-none focus:border-[var(--border-strong)] outline-none min-h-[80px]"
                    />

                    <div className="self-end">
                        <button disabled={loading || !newComment.trim()} type="submit" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-6 py-2 rounded transition-colors disabled:opacity-50">
                            {loading ? 'Posting...' : (postType === 'issue' ? 'Open Issue' : 'Post comment')}
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-4 pt-4">
                {displayComments.map((comment) => {
                    const isIssue = comment.type === 'issue'
                    const stepNum = comment.step_id ? steps.findIndex(s => s.id === comment.step_id) + 1 : null

                    return (
                        <div key={comment.id} className={`flex gap-4 group`}>
                            <Avatar seed={comment.profile?.avatar_seed || 'default'} size={40} />
                            <div className={`flex-1 border rounded-lg p-4 relative ${isIssue ? 'border-orange-500/30 bg-orange-500/5' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {isIssue && (
                                            comment.status === 'open' ? <AlertCircle className="w-4 h-4 text-orange-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />
                                        )}
                                        <span className="font-medium text-sm text-[var(--text-primary)]">{comment.profile?.username}</span>
                                        {stepNum && stepNum > 0 && <span className="text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded px-1.5 py-0.5">Step {stepNum}</span>}
                                    </div>
                                    <span className="text-xs text-[var(--text-tertiary)]">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                {isIssue && comment.title && <h4 className="font-semibold text-[var(--text-primary)] mb-1">{comment.title}</h4>}
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{comment.content}</p>

                                <div className="flex items-center justify-end gap-3 mt-3">
                                    {(user?.id === comment.user_id || comment.profile?.is_admin) && isIssue && (
                                        <button onClick={() => toggleStatus(comment.id, comment.status || 'open')} className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                            {comment.status === 'open' ? 'Close Issue' : 'Reopen Issue'}
                                        </button>
                                    )}
                                    {(user?.id === comment.user_id) && (
                                        <button onClick={() => handleDelete(comment.id)} className="text-[var(--text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {displayComments.length === 0 && <p className="text-sm text-[var(--text-tertiary)] py-4">No content here yet. Start the conversation!</p>}
            </div>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} trigger="review" />
        </div>
    )
}