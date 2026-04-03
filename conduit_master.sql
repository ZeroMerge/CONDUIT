-- ================================================================
--  CONDUIT PLATFORM — MASTER DATABASE SCHEMA v4.0
--  Engine  : PostgreSQL 15+  |  Host: Supabase
--  Tables  : 8  |  Flows: 5  |  Steps: 60
--
--  THIS SCRIPT IS FULLY IDEMPOTENT.
--  It uses CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN
--  so it works on both fresh and pre-existing databases.
--
--  COLUMN NAMES MATCH THE NEXT.JS APP EXACTLY.
--  The app uses user_id (not profile_id) everywhere.
-- ================================================================


-- ================================================================
--  §0  EXTENSIONS & CUSTOM TYPES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flow_status') THEN
    CREATE TYPE flow_status AS ENUM ('verified', 'unverified');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_status') THEN
    CREATE TYPE safety_status AS ENUM ('safe', 'caution', 'risky');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
  END IF;
END $$;


-- ================================================================
--  §1  CORE TABLES
-- ================================================================

-- ── 1.1  profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username                 TEXT        NOT NULL UNIQUE,
  avatar_seed              TEXT,
  avatar_bg_color          TEXT,
  bio                      TEXT,
  total_xp                 INT         NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  total_time_saved_minutes INT         NOT NULL DEFAULT 0 CHECK (total_time_saved_minutes >= 0),
  current_streak           INT         NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak           INT         NOT NULL DEFAULT 0,
  last_completed_date      TEXT,
  is_admin                 BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist for pre-existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_completed_date TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;


-- ── 1.2  flows ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flows (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT          NOT NULL,
  description       TEXT,
  category          TEXT          NOT NULL DEFAULT 'General',
  readme_markdown   TEXT,
  status            flow_status   NOT NULL DEFAULT 'unverified',
  safety_status     safety_status NOT NULL DEFAULT 'safe',
  creator_id        UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_minutes INT           CHECK (estimated_minutes > 0),
  xp_reward         INT           NOT NULL DEFAULT 50,
  run_count         INT           NOT NULL DEFAULT 0 CHECK (run_count >= 0),
  completion_count  INT           NOT NULL DEFAULT 0 CHECK (completion_count >= 0),
  like_count        INT           NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  fork_count        INT           NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.flows ADD COLUMN IF NOT EXISTS xp_reward INT NOT NULL DEFAULT 50;
ALTER TABLE public.flows ADD COLUMN IF NOT EXISTS fork_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.flows ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.flows ADD COLUMN IF NOT EXISTS run_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.flows ADD COLUMN IF NOT EXISTS completion_count INT NOT NULL DEFAULT 0;


-- ── 1.3  steps ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.steps (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id          UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  order_index      INT         NOT NULL CHECK (order_index >= 0),
  title            TEXT        NOT NULL,
  instruction      TEXT        NOT NULL,
  prompt_text      TEXT        DEFAULT NULL,
  expected_outcome TEXT,
  start_count      INT         NOT NULL DEFAULT 0,
  complete_count   INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS start_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS complete_count INT NOT NULL DEFAULT 0;


-- ── 1.4  completions ──────────────────────────────────────────
--  APP USES: user_id (NOT profile_id)
CREATE TABLE IF NOT EXISTS public.completions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id             UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  success             BOOLEAN     NOT NULL DEFAULT TRUE,
  feedback            TEXT,
  difficulty          TEXT        CHECK (difficulty IN ('easy','medium','hard')),
  proof_url           TEXT,
  time_saved_minutes  INT         NOT NULL DEFAULT 0,
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: rename profile_id → user_id if table pre-exists with old name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='completions' AND column_name='profile_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='completions' AND column_name='user_id')
  THEN
    ALTER TABLE public.completions RENAME COLUMN profile_id TO user_id;
    RAISE NOTICE 'completions: renamed profile_id → user_id';
  END IF;
END $$;

ALTER TABLE public.completions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.completions ADD COLUMN IF NOT EXISTS time_saved_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE public.completions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE public.completions ADD COLUMN IF NOT EXISTS proof_url TEXT;


-- ── 1.5  likes ────────────────────────────────────────────────
--  APP USES: user_id (NOT profile_id)
CREATE TABLE IF NOT EXISTS public.likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id    UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (flow_id, user_id)
);

-- Migration: rename profile_id → user_id if table pre-exists with old name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='likes' AND column_name='profile_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='likes' AND column_name='user_id')
  THEN
    ALTER TABLE public.likes RENAME COLUMN profile_id TO user_id;
    RAISE NOTICE 'likes: renamed profile_id → user_id';
  END IF;
END $$;

ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS user_id UUID;


-- ── 1.6  comments ─────────────────────────────────────────────
--  APP USES: user_id, content, step_id, status, title, type
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id    UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  step_id    UUID        REFERENCES public.steps(id) ON DELETE SET NULL,
  status     TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  title      TEXT,
  type       TEXT        NOT NULL DEFAULT 'comment' CHECK (type IN ('comment','issue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: rename profile_id → user_id if table pre-exists with old name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='profile_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='user_id')
  THEN
    ALTER TABLE public.comments RENAME COLUMN profile_id TO user_id;
    RAISE NOTICE 'comments: renamed profile_id → user_id';
  END IF;
  -- Rename body → content if old column name exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='body')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='content')
  THEN
    ALTER TABLE public.comments RENAME COLUMN body TO content;
    RAISE NOTICE 'comments: renamed body → content';
  END IF;
END $$;

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS step_id UUID;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'comment';


-- ── 1.7  merge_requests ───────────────────────────────────────
--  APP USES: parent_flow_id, fork_flow_id, creator_id (NOT submitter_id, NOT diff_json, NOT flow_id)
CREATE TABLE IF NOT EXISTS public.merge_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_flow_id  UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  fork_flow_id    UUID        NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  creator_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  status          TEXT        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open','merged','closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: rename submitter_id → creator_id if table pre-exists with old name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='merge_requests' AND column_name='submitter_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='merge_requests' AND column_name='creator_id')
  THEN
    ALTER TABLE public.merge_requests RENAME COLUMN submitter_id TO creator_id;
    RAISE NOTICE 'merge_requests: renamed submitter_id → creator_id';
  END IF;
END $$;

ALTER TABLE public.merge_requests ADD COLUMN IF NOT EXISTS parent_flow_id UUID;
ALTER TABLE public.merge_requests ADD COLUMN IF NOT EXISTS fork_flow_id UUID;
ALTER TABLE public.merge_requests ADD COLUMN IF NOT EXISTS creator_id UUID;


-- ── 1.8  user_skills ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_skills (
  user_id   UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category  TEXT   NOT NULL,
  xp_amount INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, category)
);


-- ================================================================
--  §2  INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username   ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin   ON public.profiles (is_admin) WHERE is_admin = TRUE;

CREATE INDEX IF NOT EXISTS idx_flows_creator       ON public.flows (creator_id);
CREATE INDEX IF NOT EXISTS idx_flows_status        ON public.flows (status);
CREATE INDEX IF NOT EXISTS idx_flows_category      ON public.flows (category);
CREATE INDEX IF NOT EXISTS idx_flows_likes         ON public.flows (like_count DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_steps_flow_order ON public.steps (flow_id, order_index);

CREATE INDEX IF NOT EXISTS idx_completions_flow    ON public.completions (flow_id);
CREATE INDEX IF NOT EXISTS idx_completions_user    ON public.completions (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_completions_flow_user ON public.completions (flow_id, user_id);

CREATE INDEX IF NOT EXISTS idx_likes_flow          ON public.likes (flow_id);

CREATE INDEX IF NOT EXISTS idx_comments_flow       ON public.comments (flow_id);
CREATE INDEX IF NOT EXISTS idx_comments_step       ON public.comments (step_id);

CREATE INDEX IF NOT EXISTS idx_mr_parent_flow      ON public.merge_requests (parent_flow_id);
CREATE INDEX IF NOT EXISTS idx_mr_status           ON public.merge_requests (status);

CREATE INDEX IF NOT EXISTS idx_user_skills_user    ON public.user_skills (user_id);


-- ================================================================
--  §3  STORED FUNCTIONS (defined BEFORE triggers and policies)
-- ================================================================

-- ── is_admin: used by RLS policies ────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(p_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_id),
    FALSE
  );
$$;

-- ── sync_like_count: trigger on likes ─────────────────────────
CREATE OR REPLACE FUNCTION public.sync_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.flows SET like_count = like_count + 1 WHERE id = NEW.flow_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.flows SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.flow_id;
  END IF;
  RETURN NULL;
END;
$$;

-- ── handle_updated_at: auto-bump updated_at ───────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ── increment_run_count ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_run_count(flow_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.flows SET run_count = run_count + 1 WHERE id = flow_id;
END;
$$;

-- ── increment_completion_count ────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_completion_count(flow_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.flows SET completion_count = completion_count + 1 WHERE id = flow_id;
END;
$$;

-- ── increment_fork_count ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_fork_count(target_flow_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.flows SET fork_count = fork_count + 1 WHERE id = target_flow_id;
END;
$$;

-- ── increment_step_start ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_step_start(target_step_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.steps SET start_count = start_count + 1 WHERE id = target_step_id;
END;
$$;

-- ── increment_step_complete ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_step_complete(target_step_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.steps SET complete_count = complete_count + 1 WHERE id = target_step_id;
END;
$$;

-- ── complete_flow_v2 ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_flow_v2(
  f_id       UUID,
  p_id       UUID,
  time_saved INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF f_id IS NULL THEN RAISE EXCEPTION 'f_id cannot be NULL'; END IF;
  IF p_id IS NULL THEN RAISE EXCEPTION 'p_id cannot be NULL'; END IF;

  UPDATE public.flows
  SET completion_count = completion_count + 1, updated_at = NOW()
  WHERE id = f_id;

  UPDATE public.profiles
  SET
    total_xp                 = total_xp + 100,
    total_time_saved_minutes = total_time_saved_minutes + GREATEST(time_saved, 0),
    current_streak           = current_streak + 1,
    updated_at               = NOW()
  WHERE id = p_id;
END;
$$;


-- ================================================================
--  §4  TRIGGERS
-- ================================================================

DROP TRIGGER IF EXISTS trg_sync_like_count           ON public.likes;
DROP TRIGGER IF EXISTS trg_profiles_updated_at       ON public.profiles;
DROP TRIGGER IF EXISTS trg_flows_updated_at          ON public.flows;
DROP TRIGGER IF EXISTS trg_steps_updated_at          ON public.steps;
DROP TRIGGER IF EXISTS trg_merge_requests_updated_at ON public.merge_requests;

CREATE TRIGGER trg_sync_like_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_like_count();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_flows_updated_at
  BEFORE UPDATE ON public.flows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_steps_updated_at
  BEFORE UPDATE ON public.steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_merge_requests_updated_at
  BEFORE UPDATE ON public.merge_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ================================================================
--  §5  ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills    ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_read_all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_read_all"   ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- ── FLOWS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "flows_read_all"           ON public.flows;
DROP POLICY IF EXISTS "flows_insert_auth"        ON public.flows;
DROP POLICY IF EXISTS "flows_update_owner_admin" ON public.flows;
DROP POLICY IF EXISTS "flows_delete_owner_admin" ON public.flows;

CREATE POLICY "flows_read_all"           ON public.flows FOR SELECT USING (TRUE);
CREATE POLICY "flows_insert_auth"        ON public.flows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);
CREATE POLICY "flows_update_owner_admin" ON public.flows FOR UPDATE USING (auth.uid() = creator_id OR public.is_admin()) WITH CHECK (auth.uid() = creator_id OR public.is_admin());
CREATE POLICY "flows_delete_owner_admin" ON public.flows FOR DELETE USING (auth.uid() = creator_id OR public.is_admin());

-- ── STEPS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "steps_read_all"           ON public.steps;
DROP POLICY IF EXISTS "steps_write_owner_admin"  ON public.steps;
DROP POLICY IF EXISTS "steps_update_owner_admin" ON public.steps;
DROP POLICY IF EXISTS "steps_delete_owner_admin" ON public.steps;

CREATE POLICY "steps_read_all"           ON public.steps FOR SELECT USING (TRUE);
CREATE POLICY "steps_write_owner_admin"  ON public.steps FOR INSERT WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.flows f WHERE f.id = flow_id AND f.creator_id = auth.uid())
);
CREATE POLICY "steps_update_owner_admin" ON public.steps FOR UPDATE USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.flows f WHERE f.id = flow_id AND f.creator_id = auth.uid())
);
CREATE POLICY "steps_delete_owner_admin" ON public.steps FOR DELETE USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.flows f WHERE f.id = flow_id AND f.creator_id = auth.uid())
);

-- ── COMPLETIONS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "completions_read_own"   ON public.completions;
DROP POLICY IF EXISTS "completions_insert_own" ON public.completions;
DROP POLICY IF EXISTS "completions_admin_all"  ON public.completions;

CREATE POLICY "completions_read_own"   ON public.completions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "completions_insert_own" ON public.completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "completions_admin_all"  ON public.completions FOR ALL USING (public.is_admin());

-- ── LIKES ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "likes_read_all"   ON public.likes;
DROP POLICY IF EXISTS "likes_own_write"  ON public.likes;
DROP POLICY IF EXISTS "likes_own_delete" ON public.likes;

CREATE POLICY "likes_read_all"   ON public.likes FOR SELECT USING (TRUE);
CREATE POLICY "likes_own_write"  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_own_delete" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- ── COMMENTS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "comments_read_all"           ON public.comments;
DROP POLICY IF EXISTS "comments_insert_auth"        ON public.comments;
DROP POLICY IF EXISTS "comments_update_owner_admin" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_owner_admin" ON public.comments;

CREATE POLICY "comments_read_all"           ON public.comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert_auth"        ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "comments_update_owner_admin" ON public.comments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "comments_delete_owner_admin" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ── MERGE REQUESTS ───────────────────────────────────────────
DROP POLICY IF EXISTS "mr_read_all"     ON public.merge_requests;
DROP POLICY IF EXISTS "mr_insert_auth"  ON public.merge_requests;
DROP POLICY IF EXISTS "mr_admin_review" ON public.merge_requests;

CREATE POLICY "mr_read_all"     ON public.merge_requests FOR SELECT USING (TRUE);
CREATE POLICY "mr_insert_auth"  ON public.merge_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);
CREATE POLICY "mr_admin_review" ON public.merge_requests FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── USER SKILLS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "user_skills_read_own"   ON public.user_skills;
DROP POLICY IF EXISTS "user_skills_write_own"  ON public.user_skills;

CREATE POLICY "user_skills_read_own"  ON public.user_skills FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_skills_write_own" ON public.user_skills FOR ALL USING (auth.uid() = user_id);


-- ================================================================
--  §6  SEED DATA — 5 LEGENDARY WORKFLOWS
-- ================================================================

DO $$
DECLARE
  f1 UUID := 'c00d0001-0000-0000-0000-000000000001';  -- Solopreneur OS
  f2 UUID := 'c00d0001-0000-0000-0000-000000000002';  -- 0 to MVP
  f3 UUID := 'c00d0001-0000-0000-0000-000000000003';  -- Viral Monopoly
  f4 UUID := 'c00d0001-0000-0000-0000-000000000004';  -- Sales Closer
  f5 UUID := 'c00d0001-0000-0000-0000-000000000005';  -- Passive Income Factory
BEGIN
  -- CLEAN UP: Force a clean state for these specific IDs to avoid partial or corrupted data
  DELETE FROM public.flows WHERE id IN (f1, f2, f3, f4, f5);

-- ================================================================
--  FLOW 1: The Solopreneur OS  (Automation)  |  12 steps
-- ================================================================
INSERT INTO public.flows (id, title, description, category, readme_markdown, status, safety_status, estimated_minutes)
VALUES (f1,
  E'The Solopreneur OS',
  E'A 12-step automation system that runs your entire one-person business on autopilot - lead gen, invoicing, content scheduling, and CRM - without hiring a single employee.',
  'Automation',
  E'# The Solopreneur OS\n\nRunning a one-person business means you are simultaneously the CEO, marketer, accountant, and customer support rep. This system changes that. By the end of this flow, you will have a fully automated operating layer that handles lead generation, client invoicing, content scheduling, and relationship management - all triggered by events, not by you manually doing things.\n\n## What You Will Build\nA connected automation stack using free and low-cost tools: a lead magnet funnel that captures and qualifies prospects, a no-touch invoicing pipeline that sends, follows up, and marks payments, a content calendar that auto-schedules and repurposes your posts, and a lightweight CRM that logs every client interaction without you lifting a finger.\n\n## Who This Is For\nThis flow is designed for consultants, freelancers, coaches, and indie founders who are earning between $3k-$30k/month and spending more than 10 hours per week on admin work.',
  'verified', 'safe', 90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome) VALUES
(f1, 0, 'Map Your Revenue Operations',
 'Before automating anything, you need a clear picture of where your time actually goes. List every repeating task in your business that happens more than once per week.',
 E'I run a solo [TYPE OF BUSINESS]. Here are my repeating weekly tasks:\n[LIST YOUR TASKS]\n\nAnalyse these tasks and produce:\n1. A priority matrix: Automate | Delegate | Eliminate | Keep Manual\n2. Estimated hours per week for each task\n3. Top 5 automation candidates ranked by time-savings potential\n4. Recommended tool for each: n8n / Zapier / Make / native app feature\n5. Total hours I could reclaim per week if the top 5 are automated',
 'A prioritised automation roadmap with tool recommendations and projected time savings.'),
(f1, 1, 'Build Your Lead Magnet Funnel',
 'Your lead generation must run while you sleep. Create a lead magnet and wire it to an automated email sequence.',
 E'I help [TARGET AUDIENCE] achieve [OUTCOME]. My price point is [PRICE RANGE].\n\nCreate a complete lead magnet system:\n1. 3 lead magnet concepts ranked by conversion potential\n2. Full copy for the highest-ranked option\n3. A 5-email nurture sequence with subject lines, preview text, and body for each email.',
 'A complete lead magnet asset + 5-email nurture sequence.'),
(f1, 2, 'Automate Lead Qualification',
 'Not every lead deserves your time. Set up an automated qualification survey that scores leads before they reach your calendar.',
 E'I offer [SERVICE] for [TARGET CLIENT]. My minimum project budget is [AMOUNT].\n\nDesign a lead qualification system:\n1. 8 survey questions that reveal: budget, urgency, decision-making authority, and fit\n2. A scoring rubric\n3. Score thresholds: Hot | Warm | Cold\n4. Copy for each outcome page\n5. Instructions for Typeform or Tally setup',
 'A scored qualification form with 3-tier routing logic.'),
(f1, 3, 'Connect Your CRM',
 'Every qualified lead must flow automatically into a CRM without manual data entry.',
 E'My stack:\n- Form tool: [TYPEFORM / TALLY]\n- CRM: [NOTION / AIRTABLE / HUBSPOT]\n\nGenerate:\n1. Every form field → CRM field mapping table\n2. Computed fields\n3. The exact n8n or Zapier automation steps\n4. A test checklist\n5. Duplicate lead detection strategy',
 'A field-mapping spec + step-by-step integration instructions.'),
(f1, 4, 'Automate Your Invoicing Pipeline',
 'Late payments kill cash flow. Build an invoicing automation that sends invoices on milestones and follows up automatically.',
 E'I use [STRIPE / WAVE / FRESHBOOKS] for invoicing.\nPayment terms: Net [N] days\n\nDesign my full invoicing automation:\n1. Trigger events\n2. Invoice email copy\n3. Follow-up sequence: Day 3, Day 7, Day 14\n4. Automation steps in Make / Zapier\n5. Payment confirmation alert\n6. Partial payment handling',
 'An end-to-end invoicing automation with follow-up copy and alerts.'),
(f1, 5, 'Build a Content Repurposing Engine',
 'Write one piece of long-form content per week and let automation turn it into 10–15 platform-native posts.',
 E'My primary format: [NEWSLETTER / BLOG / YOUTUBE]\nPlatforms: [LIST THEM]\n\nDesign my content repurposing system:\n1. A repurposing map: 8-10 derivative formats per platform\n2. AI prompts for Twitter threads, LinkedIn posts, and video scripts\n3. Buffer / Publer setup\n4. A content calendar template',
 'A content repurposing map + scheduling automation + AI extraction prompts.'),
(f1, 6, 'Set Up Client Onboarding on Autopilot',
 'The moment a client signs, your onboarding should start automatically.',
 E'My client onboarding currently involves: [LIST STEPS]\n\nGenerate an automated onboarding blueprint:\n1. Welcome email copy\n2. Onboarding form: 10 questions\n3. Kickoff document template\n4. Automation sequence\n5. Calendly or Cal.com setup tips',
 'A complete automated onboarding sequence from contract to kickoff.'),
(f1, 7, 'Build Your Referral Engine',
 'Set up an automated referral system that triggers 30 days after project completion.',
 E'My service: [SERVICE]\nAverage project value: [AMOUNT]\n\nDesign my referral system:\n1. 30-day post-completion referral email\n2. Referral landing page brief\n3. CRM tracking\n4. Thank-you sequence\n5. Referral partner agreement template\n6. Quarterly reactivation campaign',
 'An automated referral system with copy, tracking, and thank-you sequence.'),
(f1, 8, 'Automate Your Weekly Review',
 'Every Sunday, your system should email you a business dashboard with key KPIs.',
 E'My tools:\n- Revenue: [TOOL]\n- CRM: [TOOL]\n- Tasks: [TOOL]\n\nDesign my Weekly Business Review:\n1. 8 KPIs to track\n2. Sunday summary email template\n3. Data pull instructions\n4. n8n or Make setup\n5. Traffic-light scoring (Green/Amber/Red)',
 'A weekly auto-emailed business dashboard with 8 KPIs.'),
(f1, 9, 'Build a Testimonial Collection System',
 'Build an automated sequence that requests and stores testimonials 14 days after delivery.',
 E'My delivery format: [HOW YOU DELIVER]\n\nCreate my testimonial system:\n1. Day 14 email copy\n2. 3-question form\n3. Video testimonial alternative\n4. Auto-save to Notion/Airtable\n5. Repurposing instructions\n6. Permission release line',
 'An automated testimonial collection pipeline.'),
(f1, 10, 'Set Up a Zero-Inbox Email System',
 'Set up a triage system using filters, labels, and automated responses so 80% of emails never need your manual attention.',
 NULL,
 'A configured email triage system that processes 80% of email automatically.'),
(f1, 11, 'Run a Full System Audit',
 'Stress-test every automation by simulating a full client lifecycle: stranger → lead → qualified → proposal → client → delivered → referral.',
 NULL,
 'A documented system audit with gap list and monthly review scheduled.')
ON CONFLICT (flow_id, order_index) DO NOTHING;


-- ================================================================
--  FLOW 2: 0 to MVP Coding Sprint  (AI Agents)  |  14 steps
-- ================================================================
INSERT INTO public.flows (id, title, description, category, readme_markdown, status, safety_status, estimated_minutes)
VALUES (f2,
  E'0 to MVP Coding Sprint',
  E'A 14-step AI-assisted roadmap from blank screen to live deployed web application.',
  'Engineering',
  E'# 0 to MVP Coding Sprint\n\nUsing AI coding agents, go from a product idea to a deployed URL in a single session.\n\n## What You Will Build\nA full-stack web application with auth, a core feature loop, a database, and a live URL.\n\n## Who This Is For\nFounders and product thinkers with basic web understanding who are comfortable reading code.',
  'verified', 'safe', 180)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome) VALUES
(f2, 0, 'Define Your MVP Specification',
 'Write a one-page spec that ruthlessly constrains your first version to the single core action that delivers value.',
 E'My product idea: [DESCRIBE IN 2 SENTENCES]\nTarget user: [WHO THEY ARE]\n\nHelp me write a one-page MVP spec:\n1. One Sentence Pitch\n2. One Core User Action\n3. User Story\n4. Out of Scope list (10 features NOT in v1)\n5. Success metric\n6. Tech stack recommendation',
 'A one-page MVP spec with single user story, out-of-scope list, and tech stack.'),
(f2, 1, 'Choose Your Tech Stack',
 'Pick a stack based on speed to ship, not impressiveness.',
 E'My MVP one-liner: [FROM STEP 0]\nMy coding level: [NONE / BASIC / INTERMEDIATE]\n\nRecommend:\n1. Frontend framework + why\n2. Backend approach\n3. Database choice\n4. Auth solution\n5. Hosting platform + cost estimates\n6. Dependency list\n7. Component interaction explanation',
 'A justified tech stack decision with cost estimates.'),
(f2, 2, 'Scaffold the Project',
 'Generate the initial project structure. Get "Hello World" running locally.',
 E'My stack: [FROM STEP 1]\nProject name: [NAME]\nOS: [MAC / WINDOWS / LINUX]\n\nGive exact terminal commands to:\n1. Install prerequisites\n2. Scaffold project\n3. Install dependencies\n4. Set up .env.local\n5. Start dev server\n6. Verify the app works',
 'A running local development environment with correct folder structure.'),
(f2, 3, 'Design the Data Model',
 'Design your database schema before writing feature code.',
 E'My MVP core action: [FROM STEP 0]\nDatabase: [FROM STEP 1]\n\nDesign my data model:\n1. List every entity\n2. Fields with types, constraints\n3. Relationships\n4. SQL CREATE TABLE statements\n5. Indexes\n6. Seed data: 3 rows per table\n7. Future-proofing notes',
 'A complete data model with SQL schema, indexes, and seed data.'),
(f2, 4, 'Set Up Authentication',
 'Get sign-up, sign-in, and sign-out working before writing features.',
 E'My auth solution: [FROM STEP 1]\n\nStep-by-step instructions:\n1. Dashboard setup steps\n2. Sign Up, Sign In, Sign Out code\n3. Route protection\n4. Accessing current user\n5. Passing user ID to queries\n6. 6-scenario test checklist\n7. Common errors + fixes',
 'Working authentication with route protection. All 6 test scenarios passing.'),
(f2, 5, E'Build the Core Feature - UI First',
 'Build the interface before backend logic to catch usability problems cheaply.',
 E'My core user action: [FROM STEP 0]\n\nGenerate:\n1. Full component code for main feature\n2. All sub-components\n3. Loading states\n4. Empty states\n5. Error states\n6. Responsive behaviour\n7. Styling approach',
 'A complete, responsive UI with loading, empty, and error states.'),
(f2, 6, 'Wire Up the Database Layer',
 'Connect your UI to real data with CRUD functions.',
 E'My database: [FROM STEP 1]\nMy schema: [FROM STEP 3]\n\nWrite my data access layer:\n1. CREATE with validation\n2. READ with pagination\n3. UPDATE with ownership check\n4. DELETE with ownership check\n5. Error handling\n6. How to call from UI\n7. Updated UI code with real data',
 'A complete CRUD layer connected to the UI.'),
(f2, 7, 'Add Input Validation',
 'Add client-side and server-side validation using Zod.',
 E'My form fields: [LIST INPUTS]\n\nImplement:\n1. Zod schema\n2. Client-side inline errors\n3. Server-side validation\n4. Error message copy\n5. Server error display\n6. Edge cases',
 'Client + server validation with user-friendly error messages.'),
(f2, 8, 'Debug a Failing Test Case',
 'Paste your error into this prompt and learn to debug with AI.',
 E'I am encountering:\n[EXPECTED vs ACTUAL]\n[ERROR MESSAGE / STACK TRACE]\n[RELEVANT CODE]\n\nDiagnose and fix:\n1. Plain English explanation\n2. Root cause\n3. Fixed code\n4. Why the fix works\n5. Prevention strategy\n6. Related issues to watch',
 'A diagnosed and fixed bug with root cause explanation.'),
(f2, 9, 'Write Your First API Route',
 'Write and secure a server-side endpoint.',
 E'My route should: [DESCRIBE]\nRequest format: [GET/POST, body shape]\nResponse format: [JSON shape]\n\nGenerate:\n1. Full route handler code\n2. Request validation with Zod\n3. Auth check\n4. Business logic\n5. Structured success response\n6. Structured error response\n7. curl test command\n8. Rate limiting recommendation',
 'A validated, auth-protected API route with test command.'),
(f2, 10, 'Add Loading & Error Boundaries',
 'Add a global error boundary and ensure every async op has a loading state.',
 E'Framework: [FROM STEP 1]\n\nImplement:\n1. Global Error Boundary component\n2. Reusable LoadingSpinner\n3. Reusable ErrorMessage\n4. Wrapping core feature\n5. Toast notification system\n6. Testing the error boundary',
 'Error boundary, loading/error components, and toast notifications.'),
(f2, 11, 'Prepare for Deployment',
 'Run a pre-flight checklist before deploying.',
 E'My hosting: [FROM STEP 1]\n\nPre-deployment checklist:\n1. Build command verification\n2. Environment variable list\n3. Console.log + hardcoded URL check\n4. Bundle size check\n5. Config file generation\n6. Deployment commands',
 'A clean build with all env vars documented and deployment config ready.'),
(f2, 12, 'Deploy to Production',
 'Push to production and verify every feature on the live URL.',
 E'My hosting: [FROM STEP 1]\nMy repo: [GitHub / GitLab]\n\nExact deployment instructions:\n1. Connect repository\n2. Build settings\n3. Add environment variables\n4. Trigger deployment\n5. 10-point verification checklist\n6. Auto-deploy on push\n7. Rollback procedure',
 'A live production URL with automatic deployments configured.'),
(f2, 13, 'Share With Your First 10 Users',
 'Write personal outreach to your first 10 users and set up feedback collection.',
 NULL,
 'Outreach sent to 10 users, feedback form live, 7-day success metric defined.')
ON CONFLICT (flow_id, order_index) DO NOTHING;


-- ================================================================
--  FLOW 3: The Viral Monopoly Strategy  (Branding)  |  10 steps
-- ================================================================
INSERT INTO public.flows (id, title, description, category, readme_markdown, status, safety_status, estimated_minutes)
VALUES (f3,
  'The Viral Monopoly Strategy',
  'A 10-step content engine that transforms a single long-form video into 30+ platform-native pieces of viral content.',
  'Branding',
  E'# The Viral Monopoly Strategy\n\nOne idea, one long-form piece, 30+ derivative assets distributed across every platform.\n\n## What You Will Build\nA repeatable repurposing engine: one 30-60 minute video becomes 10 short-form videos, 5 Twitter threads, 4 LinkedIn posts, 3 newsletters, 3 carousel posts, and a blog article.',
  'verified', 'safe', 120)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome) VALUES
(f3, 0, 'Record Your Source Content',
 'Record one long-form video (30-60 minutes) on a topic you could talk about for 3 hours.',
 E'I want to record about: [YOUR TOPIC]\nMy audience: [TARGET]\nMy angle: [WHAT MAKES YOUR TAKE DIFFERENT]\n\nHelp me plan:\n1. Working title (SEO + curiosity gap)\n2. 10-point outline with timestamps\n3. Hook script (first 30 seconds)\n4. 3 planned quotable moments\n5. Call to action\n6. Equipment checklist',
 'A video outline, hook script, 3 quotable moments, and equipment checklist.'),
(f3, 1, 'Transcribe and Extract Ideas',
 'Upload to a transcription tool. Then use AI to extract every reusable content asset.',
 E'Here is my transcript:\n[PASTE TRANSCRIPT]\n\nExtract:\n1. 20+ standalone ideas\n2. 10+ quotable lines\n3. 5+ micro-stories\n4. All data points\n5. 5 controversial takes\n6. Tutorial moments\n7. Question hooks',
 'A numbered content bank with 50+ categorised assets.'),
(f3, 2, 'Create 10 Short-Form Video Clips',
 'Clip the 10 best moments for TikTok, Reels, and Shorts.',
 E'From my content bank, identify 10 best clips.\n\nFor each:\n1. Timestamp range\n2. Why it will perform\n3. TikTok caption\n4. Instagram Reels caption\n5. YouTube Shorts caption\n6. On-screen text hook\n7. Thumbnail recommendation',
 '10 clip briefs ranked by viral potential.'),
(f3, 3, 'Write 5 Twitter/X Threads',
 'Write 5 threads from different angles.',
 E'Write 5 Twitter threads from my content bank. Each:\n- Scroll-stopping opener\n- 8-12 tweets, each under 280 chars\n- Summary + CTA\n- Format: listicle / story / hot take / myth-bust / step-by-step\n\nLabel: Format | Reach category | Best time to post',
 '5 complete threads formatted tweet-by-tweet.'),
(f3, 4, 'Write 4 LinkedIn Articles',
 'Write 4 LinkedIn posts that feel like insider knowledge.',
 E'Write 4 LinkedIn posts:\n- Pattern-interrupt first line\n- 900-1300 words\n- Story or argument\n- End with a question\n\nAngles: personal story, contrarian opinion, framework breakdown, retrospective',
 '4 LinkedIn posts with native formatting.'),
(f3, 5, 'Write 3 Email Newsletter Issues',
 'Turn content into 3 newsletter issues that feel personal and exclusive.',
 E'My newsletter: [NAME, NICHE, TONE]\n\nEach issue:\n- 2 A/B subject lines\n- Personal opening\n- 400-600 word main piece\n- Exclusive insight\n- Practical takeaway\n- Soft CTA to video',
 '3 newsletter issues with A/B subject lines.'),
(f3, 6, 'Design 3 Carousel Posts',
 'Design slide structures for Instagram and LinkedIn.',
 E'Design 3 carousels:\n1. Cover slide copy\n2. Slides 2-8 with headlines + visual direction\n3. Final slide: summary + CTA\n4. Caption copy\n5. Canva template recommendation\n\nTopics: process breakdown, myths vs reality, key stats',
 '3 carousel structures with copy and visual direction.'),
(f3, 7, 'Write the SEO Blog Article',
 'Write a 2,000-word blog article optimised for your primary keyword.',
 E'Keyword: [KEYWORD]\nSEO intent: [INFORMATIONAL / COMMERCIAL]\n\nArticle:\n1. SEO title (under 60 chars)\n2. Meta description (under 155 chars)\n3. H-tag structure\n4. Hook intro\n5. Expanded body\n6. Internal link opportunities\n7. Conclusion with video embed\n8. Schema markup',
 'A 2,000-word SEO article with keyword-optimised structure.'),
(f3, 8, 'Schedule the Distribution Wave',
 'Orchestrate a 14-day distribution wave across platforms.',
 E'Platforms: [LIST]\nPosting capacity: [X/day]\nTime zone: [TZ]\n\nCreate:\n1. Day-by-day schedule\n2. Cross-promotion logic\n3. Platform-specific best times\n4. Day 1 push strategy\n5. Day 3/7/14 metrics check\n6. Viral response playbook',
 'A 14-day posting calendar with cross-promotion logic.'),
(f3, 9, 'Analyse Performance and Replenish',
 'After 14 days, analyse what worked and extract the pattern for the next video.',
 NULL,
 'A performance analysis identifying top-3 assets and a brief for the next video.')
ON CONFLICT (flow_id, order_index) DO NOTHING;


-- ================================================================
--  FLOW 4: High-Ticket Sales Closer  (Sales)  |  11 steps
-- ================================================================
INSERT INTO public.flows (id, title, description, category, readme_markdown, status, safety_status, estimated_minutes)
VALUES (f4,
  E'High-Ticket Sales Closer',
  E'An 11-step psychology-backed sales system from first contact to signed contract.',
  'Sales',
  E'# High-Ticket Sales Closer\n\nSelling $3k-$50k+ services requires trust, relevance, and understanding.\n\n## What You Will Build\nA complete sales system: research workflow, personalised outreach, discovery call framework, self-selling proposal, and objection-handling playbook.',
  'verified', 'safe', 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome) VALUES
(f4, 0, 'Build Your Ideal Client Profile',
 'Build a precise ICP that describes the exact company and person who is a great fit.',
 E'My service: [WHAT YOU OFFER]\nMy price: [AMOUNT]\nBest clients: [DESCRIBE 2-3]\n\nBuild my ICP:\n1. Company profile\n2. Contact profile\n3. Trigger events\n4. Pain stack\n5. Budget signals\n6. Disqualifiers\n7. Where they spend time online',
 'A complete ICP document with trigger events and pain stack.'),
(f4, 1, 'Research a Prospect Before Contact',
 'Never contact a prospect cold without 20 minutes of research.',
 E'Company: [NAME AND URL]\nContact: [NAME, TITLE, LINKEDIN]\n\nGenerate:\n1. Company snapshot\n2. Recent trigger events\n3. Contact intel\n4. Likely pain\n5. Personalisation hook\n6. Red flag check\n7. Best outreach channel',
 'A one-page prospect research brief.'),
(f4, 2, 'Write a Personalised Cold Outreach',
 'Write a cold outreach that gets a reply from someone who has never heard of you.',
 E'Research brief: [FROM STEP 1]\nChannel: [EMAIL / LINKEDIN / TWITTER]\n\nWrite 3 variations:\nA: Problem-first\nB: Trigger-event-first\nC: Social proof-first\n\nEach: subject/opener under 8 words, body under 75 words, one-question CTA\n\nPlus Day 3 and Day 7 follow-ups.',
 '3 outreach variations + follow-ups, under 75 words each.'),
(f4, 3, 'Run the Discovery Call',
 'The discovery call is a diagnostic conversation, not a sales pitch.',
 E'My service: [WHAT I OFFER]\n\nGenerate:\n1. Opening (2 min)\n2. 5 situation questions\n3. 5 problem questions\n4. 3 implication questions\n5. 2 vision questions\n6. Qualification checkpoint\n7. Transition to next step\n8. Red flags',
 'A discovery call framework with 15 questions.'),
(f4, 4, 'Write a Self-Selling Proposal',
 'A proposal that re-states their problem so precisely they feel understood.',
 E'Discovery notes: [KEY PAIN POINTS]\nSolution: [WHAT YOU WILL DO]\nPrice: [AMOUNT]\n\nGenerate:\n1. Executive Summary\n2. Recommended Solution\n3. Delivery Plan table\n4. Investment with value anchor\n5. 3 measurable outcomes\n6. Why Us\n7. Next Steps\n8. Guarantee',
 'A complete proposal outline with value-anchored pricing.'),
(f4, 5, 'Handle the "Too Expensive" Objection',
 'Price objections usually mean unconvinced on value, not unable to pay.',
 E'My price: [AMOUNT]\n\nGenerate:\n1. Pause-and-acknowledge response\n2. Clarifying question\n3. Budget issue path\n4. Value issue path\n5. Social proof pivot\n6. Smaller first engagement\n7. Graceful walk-away',
 'A price objection script with 3 response paths.'),
(f4, 6, 'Handle the "Let Me Think About It" Objection',
 'Surface the unspoken concern without being pushy.',
 E'The objection: "Let me think about it"\n\nGenerate:\n1. Why this is rarely about thinking\n2. Response that surfaces hidden concern\n3. Question for actual hesitation\n4. 4 hidden-concern handling paths\n5. "What would need to be true" close\n6. Follow-up if they go dark',
 'A handling script with 4 hidden-concern paths.'),
(f4, 7, 'Build a Follow-Up Cadence',
 'Most deals close on the 5th to 12th contact.',
 E'Prospect status: [WHERE THEY ARE]\nDeal size: [AMOUNT]\n\nDesign an 8-touch cadence:\nFor each: timing | channel | message | value add | goal\n\nPrinciples: new value every touch, vary channels, touch 8 is break-up message.\n\nPlus: 3+ month re-engagement strategy.',
 'An 8-touch follow-up cadence with re-engagement strategy.'),
(f4, 8, 'Ask for Referrals at Close',
 'The moment of signature is the ideal moment for a referral ask.',
 E'The client just signed. My service: [SERVICE]\n\nGenerate:\n1. In-moment referral ask script\n2. Day 1 onboarding email with referral\n3. Forward template\n4. Incentive framing\n5. CRM tracking\n6. 3-month check-in email',
 'A 3-touch referral system.'),
(f4, 9, 'Build a Case Study From Every Closed Deal',
 'Every closed deal is a future sales asset.',
 E'Client: [TYPE, NOT NAME]\nProblem: [WHAT THEY CAME WITH]\nSolution: [WHAT YOU DID]\nResult: [MEASURABLE OUTCOME]\n\nWrite in 3 formats:\n1. One-pager (PDF)\n2. LinkedIn post (800 words)\n3. Website snippet (150 words)\n\nPlus: 5 debrief questions',
 'A case study in 3 formats with debrief script.'),
(f4, 10, 'Measure and Improve Your Sales System',
 'Set up a simple sales dashboard tracking pipeline health and conversion rates.',
 NULL,
 'A sales dashboard tracking: outreach→reply, reply→discovery, discovery→proposal, proposal→close, average deal size, and sales cycle length.')
ON CONFLICT (flow_id, order_index) DO NOTHING;


-- ================================================================
--  FLOW 5: The Passive Income Asset Factory  (Data)  |  13 steps
-- ================================================================
INSERT INTO public.flows (id, title, description, category, readme_markdown, status, safety_status, estimated_minutes)
VALUES (f5,
  'The Passive Income Asset Factory',
  'A 13-step data-driven system to identify niches, create AI-generated digital products, and deploy automated storefronts.',
  'Data',
  E'# The Passive Income Asset Factory\n\nMost digital product businesses fail because the creator guessed on the niche. This flow eliminates the guesswork.\n\n## What You Will Build\nA research-to-revenue pipeline: keyword research, AI product creation, storefront setup, and an SEO + Pinterest traffic engine.\n\n## The Economics\nDigital products have near-zero marginal cost. A $27 template can sell 1,000 times with no additional effort.',
  'verified', 'safe', 150)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome) VALUES
(f5, 0, 'Identify 10 Candidate Niches',
 'Start with data, not passion. Identify 10 niches where people are actively spending money.',
 E'My interests: [LIST 3-5 AREAS]\n\nIdentify 10 niches:\n1. 3 sub-niches per topic\n2. Monthly search volume, competition, product opportunity\n3. Validation sources\n4. Recurring revenue potential\n5. Ranked by demand × competition × fit\n6. Top 3 to pursue',
 'A ranked list of 10 validated niches.'),
(f5, 1, 'Validate With Keyword Research',
 'Run keyword research looking for buyer-intent keywords.',
 E'Top 3 niches: [FROM STEP 0]\n\nFor each:\n1. Primary keyword\n2. 5 buyer-intent long-tails\n3. Keyword difficulty\n4. Search volume\n5. Commercial intent signals\n6. Content gap\n7. 20 related keywords\n8. Final verdict',
 'A keyword research report with buyer-intent keywords.'),
(f5, 2, 'Spy on Bestselling Products',
 'Study bestsellers on Etsy, Gumroad, and Teachable before creating anything.',
 E'My niche: [FROM STEP 1]\n\nAnalyse:\n1. 10 bestselling products with price, sales, reviews\n2. Most common format\n3. Best-reviewed product commonalities\n4. 2-3 star review complaints\n5. Price distribution\n6. 3-sentence positioning brief',
 'A competitor analysis with positioning brief.'),
(f5, 3, 'Design Your Digital Product',
 'Define format, title, structure, and angle before generating content.',
 E'Niche: [NICHE]\nFormat: [PDF / Notion / spreadsheet / prompt pack]\nBuyer: [WHO, PAIN]\nGap: [FROM STEP 2]\n\nDesign:\n1. 3 title variations\n2. Positioning tagline\n3. Table of contents\n4. 3 differentiators\n5. Price recommendation\n6. Bonus ideas\n7. Effort estimate',
 'A product design spec with differentiators and pricing.'),
(f5, 4, 'Generate the Product With AI',
 'Use AI for the 80%, your expertise for the 20% that makes it worth buying.',
 E'Product spec: [FROM STEP 3]\nMy expertise: [WHAT YOU KNOW]\n\nGenerate complete content. Flag sections needing personal expertise and claims needing sources.',
 'A complete AI-generated product draft with flagged sections.'),
(f5, 5, 'Design the Product Visuals',
 'Your cover image is your primary sales asset.',
 E'Product: [TITLE]\nAesthetic: [3 ADJECTIVES]\n\nProvide:\n1. Cover dimensions per platform\n2. Cover design elements\n3. Canva search terms\n4. Mockup assets needed\n5. 3 headline variations\n6. A/B test recommendation',
 'A visual brief for cover design + mockups.'),
(f5, 6, 'Set Up Your Storefront',
 'Configure Gumroad or Lemon Squeezy with conversion-optimised copy.',
 E'Platform: [GUMROAD / LEMON SQUEEZY]\nProduct: [TITLE, PRICE]\n\nWrite:\n1. Headline (under 10 words)\n2. Sub-headline\n3. 400-500 word PAS description\n4. 8 specific bullets\n5. "This is for you if..." (3 bullets)\n6. "This is NOT for you if..." (2 bullets)\n7. Guarantee copy\n8. FAQ (5 questions)\n9. CTA button copy (3 variations)',
 'Complete storefront copy with FAQ and guarantee.'),
(f5, 7, 'Configure Automated Delivery',
 'Automatic delivery, welcome email, and upsell within 60 seconds of purchase.',
 E'Platform: [PLATFORM]\nEmail tool: [TOOL]\n\nSet up:\n1. File delivery confirmation\n2. Purchase confirmation email\n3. Day 2 onboarding email\n4. Day 7 review request\n5. Day 14 upsell email\n6. Email list tagging\n7. Affiliate program setup',
 'Automated delivery + 4-email post-purchase sequence.'),
(f5, 8, 'Write SEO Content to Drive Organic Traffic',
 'Build a content moat using your keyword cluster.',
 E'Keywords: [FROM STEP 1]\nProduct: [TITLE AND URL]\n\nCreate:\n1. 5 priority keywords\n2. Article title, structure, word count\n3. Full brief for #1\n4. Natural product linking\n5. Content upgrade ideas\n6. 3 Pinterest pins per article',
 'A 90-day SEO content plan with Pinterest strategy.'),
(f5, 9, 'Launch a Pinterest Traffic Engine',
 'Pinterest is the most underrated traffic source for digital products.',
 E'Product: [TITLE, NICHE, URL]\nTarget buyer: [WHO]\n\nSet up:\n1. Account optimisation\n2. 5 keyword-optimised boards\n3. Pin frequency and ratio\n4. 3 pin templates\n5. Keyword placement guide\n6. 30-day schedule\n7. Click and sales tracking',
 'A Pinterest engine with board strategy and 30-day schedule.'),
(f5, 10, 'Set Up an Email List for Launch Leverage',
 'Even 200 warm subscribers can generate your first $1,000.',
 E'Niche: [NICHE]\nPaid product: [TITLE]\n\nDesign:\n1. Lead magnet concept\n2. Landing page copy\n3. Confirmation email\n4. 3-email nurture sequence\n5. Launch email\n6. Buyer vs non-buyer segmentation',
 'A lead magnet + landing page + nurture + launch email.'),
(f5, 11, 'Run Your First Launch',
 'You need a validated product, 100 warm people, and a 5-day launch sequence.',
 E'Launch date: [DATE]\nList size: [N]\nProduct: [TITLE, PRICE, URL]\n\nDesign 5-day sequence:\nDay 1: Announcement\nDay 2: Problem\nDay 3: Social proof\nDay 4: Early-bird\nDay 5: Final hours\n\nFor each: email + social + DM outreach\nPlus: 72-hour post-launch playbook',
 'A complete 5-day launch sequence.'),
(f5, 12, 'Scale: Double Down on What Works',
 'After 30 days, analyse traffic, conversion, and buyer demographics to decide next steps.',
 NULL,
 'A 30-day performance report with traffic, conversion, and scaling decision.')
ON CONFLICT (flow_id, order_index) DO NOTHING;

END $$;


-- ================================================================
--  END OF SCRIPT
--  8 tables · 60 steps · Full RLS · All functions · Production-ready
-- ================================================================
