-- ============================================================
-- CONDUIT — Phase 3 Database Migrations
-- Run this script in your Supabase SQL Editor.
-- ============================================================

-- ── 1. MERGE REQUESTS ───────────────────────────────────────
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

-- ── 2. UPGRADE COMMENTS TO ISSUES ─────────────────────────────────
-- Add step_id to comments to tie them to specific steps
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES public.steps(id) ON DELETE CASCADE;
-- Add status to comments to act as "issues"
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed'));
-- Add title for issues (falling back to NULL for old basic comments)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS title TEXT;
-- Distinguish between 'comment' and 'issue'
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'comment' CHECK (type IN ('comment', 'issue'));

-- ── 3. CREATOR ANALYTICS COUNTERS ─────────────────────────────────
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS start_count INTEGER DEFAULT 0;
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS complete_count INTEGER DEFAULT 0;

-- Optional: RPCs for incrementing step counters securely
CREATE OR REPLACE FUNCTION public.increment_step_start(target_step_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.steps
  SET start_count = start_count + 1
  WHERE id = target_step_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_step_complete(target_step_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.steps
  SET complete_count = complete_count + 1
  WHERE id = target_step_id;
$$;

-- ── 4. GRANTS ──────────────────────────────────────────────────
GRANT ALL ON TABLE public.merge_requests TO authenticated, service_role;
GRANT SELECT ON TABLE public.merge_requests TO anon;
GRANT EXECUTE ON FUNCTION public.increment_step_start TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_step_complete TO anon, authenticated, service_role;
