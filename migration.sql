-- Migration: Sync schema with latest Profile & Flow features
-- Run this in your Supabase SQL Editor

-- 1. Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_bg_color TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS github_handle TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS readme_markdown TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pinned_flow_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;

-- 2. Update Flows Table
ALTER TABLE public.flows
ADD COLUMN IF NOT EXISTS readme_markdown TEXT;

-- 3. Update Comments Table (matching types.ts)
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES public.steps(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'comment' CHECK (type IN ('comment', 'issue'));

-- 4. Create Merge Requests Table (if not exists, as seen in types.ts)
CREATE TABLE IF NOT EXISTS public.merge_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_flow_id   UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  fork_flow_id     UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  creator_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  status           TEXT        DEFAULT 'open' CHECK (status IN ('open', 'merged', 'closed')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Re-grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ══════════════════════════════════════════════════════
-- SOCIAL: FOLLOWS
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES auth.users NOT NULL,
  following_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone."
  ON public.follows FOR SELECT
  USING ( true );

CREATE POLICY "Users can follow others."
  ON public.follows FOR INSERT
  WITH CHECK ( auth.uid() = follower_id );

CREATE POLICY "Users can unfollow others."
  ON public.follows FOR DELETE
  USING ( auth.uid() = follower_id );

-- Indexes
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);

-- Re-grant permissions for the new table
GRANT ALL ON public.follows TO authenticated, service_role;
GRANT SELECT ON public.follows TO anon;

