-- ============================================================
-- CONDUIT — Row Level Security (RLS) Policies
-- Run this AFTER schema.sql.
-- RLS ensures users can only modify their own data while
-- keeping all content publicly readable.
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments   ENABLE ROW LEVEL SECURITY;


-- ── PROFILES ─────────────────────────────────────────────────

-- Anyone can read any profile (public portfolio)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- A user can create their own profile (one-time, on signup)
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- A user can update their own profile (bio, avatar, etc.)
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile (e.g. to grant/revoke is_admin via API)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );


-- ── FLOWS ─────────────────────────────────────────────────────

CREATE POLICY "flows_select_public"
  ON public.flows FOR SELECT
  USING (true);

CREATE POLICY "flows_insert_authenticated"
  ON public.flows FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "flows_update_own"
  ON public.flows FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "flows_delete_own"
  ON public.flows FOR DELETE
  USING (auth.uid() = creator_id);

-- Admins can update ANY flow (for verification / moderation)
CREATE POLICY "flows_update_admin"
  ON public.flows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Admins can delete ANY flow
CREATE POLICY "flows_delete_admin"
  ON public.flows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );


-- ── STEPS ─────────────────────────────────────────────────────

CREATE POLICY "steps_select_public"
  ON public.steps FOR SELECT
  USING (true);

CREATE POLICY "steps_insert_creator"
  ON public.steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flows
      WHERE id = flow_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "steps_update_creator"
  ON public.steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.flows
      WHERE id = flow_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "steps_delete_creator"
  ON public.steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.flows
      WHERE id = flow_id AND creator_id = auth.uid()
    )
  );


-- ── COMPLETIONS ───────────────────────────────────────────────

CREATE POLICY "completions_select_public"
  ON public.completions FOR SELECT
  USING (true);

CREATE POLICY "completions_insert_self"
  ON public.completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "completions_update_self"
  ON public.completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "completions_delete_self"
  ON public.completions FOR DELETE
  USING (auth.uid() = user_id);


-- ── LIKES ─────────────────────────────────────────────────────

CREATE POLICY "likes_select_public"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "likes_insert_self"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_self"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);


-- ── USER_SKILLS ───────────────────────────────────────────────

CREATE POLICY "user_skills_select_public"
  ON public.user_skills FOR SELECT
  USING (true);

CREATE POLICY "user_skills_all_self"
  ON public.user_skills FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── COMMENTS ─────────────────────────────────────────────────

CREATE POLICY "comments_select_public"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "comments_insert_authenticated"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any comment for moderation
CREATE POLICY "comments_delete_admin"
  ON public.comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );


-- ── STORAGE — proof-images bucket ────────────────────────────

-- Supabase storage policies live on storage.objects
CREATE POLICY "proof_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-images');

CREATE POLICY "proof_images_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proof-images'
    AND auth.uid() IS NOT NULL
  );

-- Users can only delete their own uploads
-- (file names are UUIDs, not user-namespaced, so we rely on auth for this)
CREATE POLICY "proof_images_delete_authenticated"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proof-images'
    AND auth.uid() IS NOT NULL
  );
