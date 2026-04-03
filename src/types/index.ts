export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_seed: string
  avatar_bg_color?: string | null
  bio: string | null
  created_at: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  total_time_saved_minutes: number
  total_xp: number
  is_admin?: boolean
  is_verified?: boolean
  trust_score?: number
  website_url?: string | null
  twitter_handle?: string | null
  github_handle?: string | null
  location?: string | null
  company?: string | null
  readme_markdown?: string | null
  social_links?: any | null
  pinned_flow_ids?: string[] | null
  flows?: any[]
  completions?: any[]
}

export interface Flow {
  id: string
  title: string
  description: string
  readme_markdown: string | null
  category: string
  estimated_minutes: number
  creator_id: string | null
  status: 'verified' | 'unverified' | 'pending'
  safety_status: 'safe' | 'caution' | 'risky'
  completion_count: number
  run_count: number
  like_count: number
  created_at: string
  xp_reward: number
  parent_flow_id: string | null
  fork_count: number
}

export interface Step {
  id: string
  flow_id: string
  order_index: number
  title: string
  instruction: string
  prompt_text: string
  expected_outcome: string
  example_output: string | null
  start_count?: number
  complete_count?: number
}

export interface Completion {
  id: string
  flow_id: string
  user_id: string
  success: boolean
  difficulty: 'easy' | 'medium' | 'hard' | null
  feedback: string | null
  proof_url: string | null
  completed_at: string
  time_saved_minutes: number
}

export interface Like {
  flow_id: string
  user_id: string
}

export interface UserSkill {
  user_id: string
  category: string
  xp_amount: number
}

export interface Comment {
  id: string
  flow_id: string
  user_id: string
  content: string
  created_at: string
  step_id?: string | null
  status?: 'open' | 'closed'
  title?: string | null
  type?: 'comment' | 'issue'
}

export interface MergeRequest {
  id: string
  parent_flow_id: string
  fork_flow_id: string
  creator_id: string
  title: string
  description: string | null
  status: 'open' | 'merged' | 'closed'
  created_at: string
  updated_at: string
}

export interface FlowWithCreator extends Flow {
  creator?: Profile | null
  parent_flow?: { id: string; title: string; creator?: Profile | null } | null
}

export interface CompletionWithDetails extends Completion {
  profile?: Profile
  flow?: Flow
}

export interface CommentWithProfile extends Comment {
  profile?: Profile
}

export interface MergeRequestWithDetails extends MergeRequest {
  creator?: Profile | null
  fork_flow?: Flow | null
  parent_flow?: Flow | null
}