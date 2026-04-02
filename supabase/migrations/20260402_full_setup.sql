-- Migration: Full Database Setup (Schema + 4 Community-Focused Premium Seed Workflows)
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

-- 3. Seed ALL 4 PREMIUM Starter Workflows

-- 3.1. The "Senior Architect" Code Audit Suite
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward, readme_markdown)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'The "Senior Architect" Code Audit Suite',
  'A rigorous technical audit flow designed to transform raw code into security-hardened software.',
  'DevOps & Security',
  15,
  'verified',
  'safe',
  500,
  '### Enterprise Code Review Standard\nFind vulnerabilities and optimize your codebase instantly.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('a1111111-1111-1111-1111-111111111111', 0, 'Phase 1: Security Audit', 'Analyze code for standard vulnerabilities.', 'Audit this code: {{INPUT_CODE}}', 'Security report.'),
('a1111111-1111-1111-1111-111111111111', 1, 'Phase 2: Performance Audit', 'Analyze O-notation.', 'Identify efficiency gaps in: {{INPUT_CODE}}', 'Performance report.')
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
('b2222222-2222-2222-2222-222222222222', 1, 'Visual Prompt Library', 'Generate Midjourney prompts.', 'Create high-fidelity visual tokens for {{PRODUCT}}', 'Visual style guide.')
ON CONFLICT (id) DO NOTHING;

-- 3.3. Conduit Masterclass: Platform Onboarding (COMMUNITY WORKFLOW)
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward, readme_markdown)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'Conduit Masterclass: How to Conquer the Platform',
  'The official guide for the community to learn how to discover, fork, and verify AI workflows.',
  'Education',
  10,
  'verified',
  'safe',
  1000,
  '### Welcome to the Conduit Community\nMaster the art of verifiable AI. This flow will teach you how to excel in our ecosystem.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('c3333333-3333-3333-3333-333333333333', 0, 'Flow Discovery', 'Explore the "Explore" page and learn how to identify "Safe" vs "Risky" safety statuses.', 'Summarize how you distinguish verified flows.', 'Platform awareness.'),
('c3333333-3333-3333-3333-333333333333', 1, 'Forking for Customization', 'Learn how to take an existing flow and modify it for your specific user case.', 'Explain the benefit of "Forking" over starting from scratch.', 'Forking competency.'),
('c3333333-3333-3333-3333-333333333333', 2, 'Validation & XP Mastery', 'Understand how to submit proof and earn experience points (XP) and streak rewards.', 'Click "Complete" on a flow and see how your profile XP increases.', 'Gamification mastery.')
ON CONFLICT (id) DO NOTHING;

-- 3.4. Viral Social Omnichannel Factory (COMMUNITY WORKFLOW)
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward, readme_markdown)
VALUES (
  'd4444444-4444-4444-4444-444444444444',
  'Viral Social Omnichannel Factory',
  'Transform a single idea into 10 multi-platform hooks that drive real traffic and engagement.',
  'Content Creation',
  25,
  'verified',
  'safe',
  1200,
  '### Content Velocity Standard\nStop posting manually. Build a content engine that distributes your value everywhere automatically.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
('d4444444-4444-4444-4444-444444444444', 0, 'Contextual Core Injection', 'Paste your raw source material (article, video transcript, or notes).', 'Condense this context into 3 viral themes: {{SOURCE_MATERIAL}}', 'Platform-neutral hooks.'),
('d4444444-4444-4444-4444-444444444444', 1, 'The LinkedIn Professional Thread', 'Adapt the core themes into a long-form professional carosel post.', 'Create a 5-part LinkedIn carousel based on the core themes.', 'Professional-tier content.'),
('d4444444-4443-4444-4444-444444444444', 2, 'The Viral Hook (X/Twitter)', 'Create short, high-engagement threads with specific attention hooks.', 'Draft a "mega-viral" X hook for these themes.', 'Viral engagement hooks.')
ON CONFLICT (id) DO NOTHING;
