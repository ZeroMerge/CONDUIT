-- ============================================================
-- CONDUIT — Complete Database Schema
-- Run this entire script in your Supabase SQL Editor.
-- It is idempotent — safe to run multiple times.
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                TEXT        UNIQUE NOT NULL,
  avatar_seed             TEXT        NOT NULL,
  bio                     TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  current_streak          INTEGER     DEFAULT 0,
  longest_streak          INTEGER     DEFAULT 0,
  last_completed_date     DATE,
  total_time_saved_minutes INTEGER    DEFAULT 0,
  total_xp                INTEGER     DEFAULT 0,
  is_admin                BOOLEAN     DEFAULT FALSE
);

-- ── FLOWS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flows (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  estimated_minutes INTEGER    DEFAULT 30,
  creator_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  status           TEXT        DEFAULT 'unverified'
                               CHECK (status IN ('verified', 'unverified', 'pending')),
  safety_status    TEXT        DEFAULT 'safe'
                               CHECK (safety_status IN ('safe', 'caution', 'risky')),
  completion_count INTEGER     DEFAULT 0,
  run_count        INTEGER     DEFAULT 0,
  like_count       INTEGER     DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  xp_reward        INTEGER     DEFAULT 50,
  parent_flow_id   UUID        REFERENCES public.flows(id) ON DELETE SET NULL,
  fork_count       INTEGER     DEFAULT 0
);

-- ── STEPS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.steps (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id          UUID    NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  order_index      INTEGER NOT NULL,
  title            TEXT    NOT NULL,
  instruction      TEXT    NOT NULL,   -- Markdown supported
  prompt_text      TEXT    NOT NULL,
  expected_outcome TEXT    NOT NULL,   -- Markdown supported
  example_output   TEXT
);

-- ── COMPLETIONS ───────────────────────────────────────────────
-- One row per (user × flow). Upserts on conflict update the existing row.
CREATE TABLE IF NOT EXISTS public.completions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id              UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  success              BOOLEAN     NOT NULL,
  difficulty           TEXT        CHECK (difficulty IN ('easy', 'medium', 'hard')),
  feedback             TEXT,
  proof_url            TEXT,
  completed_at         TIMESTAMPTZ DEFAULT NOW(),
  time_saved_minutes   INTEGER     DEFAULT 0,
  UNIQUE (flow_id, user_id)
);

-- ── LIKES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  flow_id  UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (flow_id, user_id)
);

-- ── USER_SKILLS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_skills (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  xp_amount  INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, category)
);

-- ── COMMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id    UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- STORED PROCEDURES (RPC functions)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_run_count(flow_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.flows
  SET run_count = run_count + 1
  WHERE id = flow_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_completion_count(flow_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.flows
  SET completion_count = completion_count + 1
  WHERE id = flow_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_fork_count(target_flow_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.flows
  SET fork_count = fork_count + 1
  WHERE id = target_flow_id;
$$;


-- ============================================================
-- TRIGGER — keep like_count in sync automatically
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.flows SET like_count = like_count + 1 WHERE id = NEW.flow_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.flows SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.flow_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_like_count();


-- ============================================================
-- STORAGE BUCKET — proof screenshots
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-images', 'proof-images', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- GRANT USAGE (required so the anon/service roles can query)
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
