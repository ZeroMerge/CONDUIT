import { createClient } from '@/lib/supabase/server'
import { ExploreClient } from './explore-client'

export default async function ExplorePage() {
  const supabase = await createClient()

  const { data: flows } = await supabase
    .from('flows')
    .select('*')
    .order('like_count', { ascending: false })

  const { data: profiles } = await supabase.from('profiles').select('total_time_saved_minutes')
  const globalTimeSavedMinutes = profiles?.reduce((sum, p) => sum + (p.total_time_saved_minutes || 0), 0) || 0

  return <ExploreClient flows={flows || []} globalTimeSavedMinutes={globalTimeSavedMinutes} />
}
