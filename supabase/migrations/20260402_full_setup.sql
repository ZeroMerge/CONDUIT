-- Migration: Conduit Core Hardening (Security & Automation)
-- Run this in your Supabase SQL Editor to finalize your system.

-- 1. RECREATE TABLES WITH ROBUST SCHEMA
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_seed TEXT NOT NULL,
  avatar_bg_color TEXT DEFAULT 'transparent',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date TIMESTAMPTZ,
  total_time_saved_minutes INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_minutes INTEGER DEFAULT 5,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  readme_markdown TEXT,
  status TEXT DEFAULT 'unverified' CHECK (status IN ('verified', 'unverified', 'pending')),
  safety_status TEXT DEFAULT 'safe' CHECK (safety_status IN ('safe', 'caution', 'risky')),
  completion_count INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  xp_reward INTEGER DEFAULT 100,
  parent_flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
  fork_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  expected_outcome TEXT NOT NULL,
  example_output TEXT,
  start_count INTEGER DEFAULT 0,
  complete_count INTEGER DEFAULT 0
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- 3. HARDENED RLS POLICIES

-- PROFILES:
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- FLOWS:
DROP POLICY IF EXISTS "Public flows are viewable by everyone" ON flows;
CREATE POLICY "Public flows are viewable by everyone" ON flows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own flows" ON flows;
CREATE POLICY "Users can insert own flows" ON flows FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators or admins can update flows" ON flows;
CREATE POLICY "Creators or admins can update flows" ON flows FOR UPDATE 
USING (auth.uid() = creator_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Creators or admins can delete flows" ON flows;
CREATE POLICY "Creators or admins can delete flows" ON flows FOR DELETE 
USING (auth.uid() = creator_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- STEPS:
DROP POLICY IF EXISTS "Public steps are viewable by everyone" ON steps;
CREATE POLICY "Public steps are viewable by everyone" ON steps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators or admins can manage steps" ON steps;
CREATE POLICY "Creators or admins can manage steps" ON steps FOR ALL 
USING (EXISTS (SELECT 1 FROM flows WHERE id = flow_id AND (creator_id = auth.uid() OR (SELECT is_admin FROM profiles WHERE id = auth.uid()))));

-- 4. THE CONDUIT ROI & GAMIFICATION ENGINE (Postgres function)
CREATE OR REPLACE FUNCTION complete_flow_v1(flow_id_input UUID, profile_id_input UUID)
RETURNS VOID AS $$
DECLARE
  v_xp_reward INTEGER;
  v_saved_minutes INTEGER;
BEGIN
  -- Get flow stats
  SELECT xp_reward, estimated_minutes INTO v_xp_reward, v_saved_minutes
  FROM flows WHERE id = flow_id_input;

  -- Update Flow counts
  UPDATE flows SET completion_count = completion_count + 1 WHERE id = flow_id_input;

  -- Update Profile
  UPDATE profiles 
  SET 
    total_xp = total_xp + v_xp_reward,
    total_time_saved_minutes = total_time_saved_minutes + v_saved_minutes,
    last_completed_date = NOW(),
    current_streak = CASE 
      WHEN last_completed_date >= (NOW() - INTERVAL '48 hours') THEN current_streak + 1 
      ELSE 1 
    END
  WHERE id = profile_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SEED PREMIUM CONTENT (Synchronized with UI Categories)

INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'The "Senior Architect" Code Audit Suite', 'Hardens raw code into production software.', 'APIs', 15, 'verified', 'safe', 500),
('b2222222-2222-2222-2222-222222222222', 'High-Conversion Brand Identity Engine', 'Establishes visual/verbal brand DNA.', 'Data', 20, 'verified', 'safe', 750),
('c3333333-3333-3333-3333-333333333333', 'Conduit Masterclass: How to Conquer the Platform', 'Official community onboarding guide.', 'AI Agents', 10, 'verified', 'safe', 1000),
('d4444444-4444-4444-4444-444444444444', 'Viral Social Omnichannel Factory', 'Single idea into 10 multi-platform hooks.', 'Automation', 25, 'verified', 'safe', 1200)
ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('a1111111-1111-1111-1111-111111111111', 0, 'Security Audit', 'Review code.', 'Audit: {{CODE}}', 'Report.'),
('b2222222-2222-2222-2222-222222222222', 0, 'Core Message', 'Map Why.', 'Golden Circle: {{PRODUCT}}', 'Mission.'),
('c3333333-3333-3333-3333-333333333333', 0, 'Platform Navigation', 'Explore.', 'Summarize "Explore" page.', 'AHA!'),
('d4444444-4444-4444-4444-444444444444', 0, 'Idea Expansion', 'Distill core idea.', 'Viral hooks for: {{IDEA}}', 'Top 10 hooks.')
ON CONFLICT (id) DO NOTHING;
