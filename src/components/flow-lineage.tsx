import Link from 'next/link'
import { GitFork } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function FlowLineage({ flowId }: { flowId: string }) {
  const supabase = await createClient()
  
  // Call the recursive RPC to get the ancestral chain
  const { data: lineage, error } = await supabase.rpc('get_flow_lineage' as any, { target_flow_id: flowId })

  // Hide if no lineage or it's just the original flow
  if (error || !lineage || (lineage as any[]).length <= 1) return null

  const items = lineage as any[]

  return (
    <div className="mt-8 pt-8 border-t border-[var(--border)]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <GitFork className="h-4 w-4" /> Flow Lineage
      </h3>
      <div className="flex flex-col gap-0 relative before:absolute before:inset-y-3 before:left-[11px] before:w-px before:bg-[var(--border)]">
        {items.map((item: any, index: number) => (
          <div key={item.id} className="flex items-start gap-4 py-2 relative z-10">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/flow/${item.id}`} className="text-sm text-[var(--text-primary)] font-medium hover:text-[var(--accent)] truncate transition-colors">
                  {item.title}
                </Link>
                {index === 0 && (
                  <span className="text-[10px] uppercase tracking-wider bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">Original</span>
                )}
                {index === items.length - 1 && (
                  <span className="text-[10px] uppercase tracking-wider bg-[var(--accent)] text-white px-1.5 py-0.5 rounded">Current</span>
                )}
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">by @{item.creator_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
