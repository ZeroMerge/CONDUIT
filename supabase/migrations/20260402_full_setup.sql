-- Migration: Definitive Database Setup (Fix Empty Feed & Permissions)
-- Run this in your Supabase SQL Editor to initialize your project

-- 1. Create/Recreate Tables with RLS Support
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

-- 2. ENABLE ROW LEVEL SECURITY (Must do this to allow reading)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- 3. CREATE PUBLIC READ POLICIES (Allows anyone to see the flows)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public flows are viewable by everyone" ON flows;
CREATE POLICY "Public flows are viewable by everyone" ON flows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public steps are viewable by everyone" ON steps;
CREATE POLICY "Public steps are viewable by everyone" ON steps FOR SELECT USING (true);

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION increment_run_count(flow_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE flows SET run_count = run_count + 1 WHERE id = flow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Content (Synchronized with UI Categories)

-- 5.1. The "Senior Architect" Code Audit Suite (Category: APIs)
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'The "Senior Architect" Code Audit Suite',
  'A rigorous technical audit flow designed to transform raw code into security-hardened software.',
  'APIs',
  15,
  'verified',
  'safe',
  500
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('a1111111-1111-1111-1111-111111111111', 0, 'Phase 1: Security Audit', 'Analyze code for standard vulnerabilities.', 'Audit this code: {{INPUT_CODE}}', 'Security report.')
ON CONFLICT (id) DO NOTHING;

-- 5.2. High-Conversion Brand Identity Engine (Category: Data)
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'High-Conversion Brand Identity Engine',
  'A strategic branding flow that establishes a complete verbal and visual DNA.',
  'Data',
  20,
  'verified',
  'safe',
  750
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('b2222222-2222-2222-2222-222222222222', 0, 'The Brand Core', 'Simons Sinek Golden Circle.', 'Map Why/How/What for {{PRODUCT}}', 'Mission statement.')
ON CONFLICT (id) DO NOTHING;

-- 5.3. Conduit Masterclass (Category: AI Agents)
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'Conduit Masterclass: How to Conquer the Platform',
  'The official guide for the community to learn how to excel in our ecosystem.',
  'AI Agents',
  10,
  'verified',
  'safe',
  1000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('c3333333-3333-3333-3333-333333333333', 0, 'Flow Discovery', 'Explore the "Explore" page.', 'Summarize how you identify verified flows.', 'Platform awareness.')
ON CONFLICT (id) DO NOTHING;

-- 5.4. Viral Social Omnichannel Factory (Category: Automation)
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES (
  'd4444444-4444-4444-4444-444444444444',
  'Viral Social Omnichannel Factory',
  'Transform a single idea into 10 multi-platform hooks that drive real traffic.',
  'Automation',
  25,
  'verified',
  'safe',
  1200
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('d4444444-4444-4444-4444-444444444444', 0, 'Contextual Core Injection', 'Paste source material.', 'Condense this context: {{SOURCE_MATERIAL}}', 'Viral hooks.')
ON CONFLICT (id) DO NOTHING;
