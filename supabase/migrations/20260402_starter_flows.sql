-- Migration: Seed starter workflows to avoid a blank home page
-- Run this in your Supabase SQL Editor

-- 1. Mastering the Conduit Platform
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Mastering the Conduit Platform',
  'Learn how to navigate, run, and create verifiable AI workflows on Conduit.',
  'Platform',
  5,
  'verified',
  'safe',
  100
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
(
  'c0000000-0000-0000-0000-000000000001',
  0,
  'Welcome to Conduit',
  'Read the hero section on the home page and understand our mission: Verifiable AI Outcomes.',
  'Summarize what "Verifiable AI Outcomes" means to you.',
  'A clear understanding of the platform''s unique value proposition.'
),
(
  'c0000000-0000-0000-0000-000000000001',
  1,
  'Finding Your First Flow',
  'Use the "Explore" tab or the "Category Filter" to find a workflow that matches your interests.',
  'Click "Browse flows" on the home page.',
  'Discovery of at least one flow you want to run.'
),
(
  'c0000000-0000-0000-0000-000000000001',
  2,
  'Running a Flow',
  'Click on a Flow Card to see its steps. A flow consists of instructions and prompt templates.',
  'Open the "Mastering Conduit" flow (this one!) and look at the steps layout.',
  'Familiarity with the Flow Details view.'
) ON CONFLICT (id) DO NOTHING;

-- 2. AI Prompting Essentials
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'The Golden Rules of Prompting',
  'Transform your AI outputs from "generic" to "expert" using a three-step framing technique.',
  'AI Engineering',
  10,
  'verified',
  'safe',
  250
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
(
  'c0000000-0000-0000-0000-000000000002',
  0,
  'The Persona Trick',
  'Always start by giving the AI a specific role (e.g., "You are a Senior Security Engineer").',
  'Draft a persona for a task you frequently perform.',
  'A prompt that begins with "You are a [Expert Role]..."'
),
(
  'c0000000-0000-0000-0000-000000000002',
  1,
  'Contextual Injection',
  'Provide "Few-Shot" examples or specific constraints so the AI knows the boundaries.',
  'Add "Constraint: Do not use technical jargon" to your persona prompt.',
  'A prompt that includes specific constraints or examples.'
) ON CONFLICT (id) DO NOTHING;
