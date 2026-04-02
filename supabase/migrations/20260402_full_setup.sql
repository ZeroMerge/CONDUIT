-- Migration: Full Database Setup (Schema + Premium Seed)
-- Run this in your Supabase SQL Editor to initialize your project

-- 1. Create Tables
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

CREATE TABLE IF NOT EXISTS completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  feedback TEXT,
  proof_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_saved_minutes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS likes (
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (flow_id, user_id)
);

-- 2. Utility Functions
CREATE OR REPLACE FUNCTION increment_run_count(flow_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE flows SET run_count = run_count + 1 WHERE id = flow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_completion_count(flow_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE flows SET completion_count = completion_count + 1 WHERE id = flow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Seed Premium Starter Content

-- 3.1. The "Senior Architect" Code Audit Suite
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward, readme_markdown)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'The "Senior Architect" Code Audit Suite',
  'A rigorous, multi-phase technical audit flow designed to transform raw code into production-ready, security-hardened software.',
  'DevOps & Security',
  15,
  'verified',
  'safe',
  500,
  '### Enterprise Code Review Standard\nThis flow mimics the workflow of a Senior Security Architect.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('a1111111-1111-1111-1111-111111111111', 0, 'Phase 1: Security Audit', 'Analyze code for standard vulnerabilities.', 'Audit this code: {{INPUT_CODE}}', 'Security report.'),
('a1111111-1111-1111-1111-111111111111', 1, 'Phase 2: Performance Audit', 'Analyze O-notation.', 'Identify O(n^2) in: {{INPUT_CODE}}', 'Performance report.'),
('a1111111-1111-1111-1111-111111111111', 2, 'Phase 3: PR Manifest', 'Generate PR description.', 'Build PR from findings.', 'Markdown PR.')
ON CONFLICT (id) DO NOTHING;

-- 3.2. Strategic Brand Identity Engine
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward, readme_markdown)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'High-Conversion Brand Identity Engine',
  'A strategic branding flow that establishes a complete verbal and visual DNA.',
  'Marketing & Strategy',
  20,
  'verified',
  'safe',
  750,
  '### Brand Genesis\nMove beyond "generate a logo".'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('b2222222-2222-2222-2222-222222222222', 0, 'The Brand Core', 'Simons Sinek Golden Circle.', 'Map Why/How/What for {{PRODUCT}}', 'Mission statement.'),
('b2222222-2222-2222-2222-222222222222', 1, 'Visual Token Library', 'Generate Midjourney prompts.', 'Create visual tokens for {{PRODUCT}}', 'Prompt library.')
ON CONFLICT (id) DO NOTHING;
