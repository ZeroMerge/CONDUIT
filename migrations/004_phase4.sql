-- ============================================================
-- CONDUIT — Phase 4 Migrations
-- Run this script in your Supabase SQL Editor.
-- ============================================================

-- 1. Trust Score and Verification
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- RPC to update a creator's trust score
CREATE OR REPLACE FUNCTION public.update_trust_score(creator_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_acc_starts INTEGER;
  total_acc_completions INTEGER;
  new_trust_score NUMERIC;
BEGIN
  -- We sum up all the start counts and completion counts for all flows authored by this creator.
  SELECT COALESCE(SUM(run_count), 0), COALESCE(SUM(completion_count), 0)
  INTO total_acc_starts, total_acc_completions
  FROM public.flows
  WHERE creator_id = creator_profile_id;

  IF total_acc_starts > 0 THEN
    new_trust_score := (total_acc_completions::NUMERIC / total_acc_starts::NUMERIC) * 100.0;
  ELSE
    new_trust_score := 0.0;
  END IF;

  UPDATE public.profiles
  SET 
    trust_score = new_trust_score,
    is_verified = (total_acc_starts >= 50 AND new_trust_score > 85.0)
  WHERE id = creator_profile_id;
END;
$$;


-- 2. Global Ticker RPC
CREATE OR REPLACE FUNCTION public.get_global_time_saved()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(total_time_saved_minutes), 0)::INTEGER
  FROM public.profiles;
$$;


-- 3. Fork Lineage RPC
-- Returns ancestry of a flow up to the root parent
CREATE OR REPLACE FUNCTION public.get_flow_lineage(target_flow_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  creator_name TEXT,
  depth INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH RECURSIVE lineage AS (
    -- Base case: the initial flow
    SELECT 
      f.id, 
      f.title, 
      (SELECT username FROM public.profiles p WHERE p.id = f.creator_id) as creator_name,
      f.parent_flow_id,
      0 as depth
    FROM public.flows f
    WHERE f.id = target_flow_id
    
    UNION ALL
    
    -- Recursive step: get the parent
    SELECT 
      parent.id, 
      parent.title, 
      (SELECT username FROM public.profiles p WHERE p.id = parent.creator_id) as creator_name,
      parent.parent_flow_id,
      l.depth + 1
    FROM public.flows parent
    INNER JOIN lineage l ON parent.id = l.parent_flow_id
  )
  SELECT id, title, creator_name, depth FROM lineage ORDER BY depth DESC;
$$;
