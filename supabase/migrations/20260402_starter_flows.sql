-- Migration: Seed PREMIUM starter workflows (Masterclass level)
-- Run this in your Supabase SQL Editor

-- 1. The "Senior Architect" Code Audit Suite
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
  '### Enterprise Code Review Standard\nThis flow mimics the workflow of a Senior Security Architect. It doesn''t just find bugs; it enforces structural integrity and performance benchmarks.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
(
  'a1111111-1111-1111-1111-111111111111',
  0,
  'Phase 1: Security & Secrets Scan',
  'Inspect the code for SQL injection vulnerabilities, XSS, and hardcoded secrets (API keys/ENVs).',
  'You are a Senior Security Engineer. Audit the following code for: \n1. SQL Injection risks\n2. Insecure Auth defaults\n3. Hardcoded secrets\n\nCode to audit:\n---\n{{INPUT_CODE}}\n---',
  'A detailed security report with severity ratings (High/Medium/Low).'
),
(
  'a1111111-1111-1111-1111-111111111111',
  1,
  'Phase 2: Performance Scalability Trace',
  'Analyze the time complexity (O-notation) and potential memory leaks in loops or state management.',
  'Analyze the algorithm complexity of this code. Identify any O(n^2) loops or circular dependencies in React/Next.js state.\n\nCode:\n---\n{{INPUT_CODE}}\n---',
  'An efficiency analysis with specific refactoring recommendations.'
),
(
  'a1111111-1111-1111-1111-111111111111',
  2,
  'Phase 3: Automated PR Manifest',
  'Synthesize the audit into a professional Pull Request description following the Conventional Commits standard.',
  'Generate a Pull Request description based on the previous two audits. Use Markdown headers for "Changes", "Security Impact", and "Performance Improvements".',
  'A copy-paste ready GitHub PR description.'
) ON CONFLICT (id) DO NOTHING;

-- 2. High-Conversion Brand Identity Engine
INSERT INTO flows (id, title, description, category, estimated_minutes, status, safety_status, xp_reward, readme_markdown)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'High-Conversion Brand Identity Engine',
  'A strategic branding flow that establishes a complete verbal and visual DNA for new products or services.',
  'Marketing & Strategy',
  20,
  'verified',
  'safe',
  750,
  '### Brand Genesis\nMove beyond "generate a logo". This flow builds the underlying psychological framework that drives customer trust and conversion.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (flow_id, order_index, title, instruction, prompt_text, expected_outcome)
VALUES 
(
  'b2222222-2222-2222-2222-222222222222',
  0,
  'The Strategic Brand Core',
  'Map out the "Golden Circle": Why you exist, How you win, and What you exactly provide.',
  'You are a Brand Strategist. Use Simon Sinek''s Golden Circle to define the core strategy for this product:\n\nProduct Name: {{PRODUCT_NAME}}\nDescription: {{DESCRIPTION}}',
  'A mission/vision statement that feels "premium" and centered.'
),
(
  'b2222222-2222-2222-2222-222222222222',
  1,
  'The Voice & Tone Architecture',
  'Establish the 2x2 matrix of brand personality traits (e.g., "Professional but not stiff").',
  'Identify the primary "Brand Voice". Provide 5 specific examples of how the brand speaks vs. how it does NOT speak.',
  'A comprehensive verbal style guide.'
),
(
  'b2222222-2222-2222-2222-222222222222',
  2,
  'Visual Token Prompt Library',
  'Generate high-fidelity visual description tokens for Midjourney/DALL-E to ensure brand consistency.',
  'Based on the "Strategic Brand Core", generate 3 Midjourney v6 parameters for: \n1. Primary Marketing Asset\n2. Minimalist Iconography\n3. Editorial Backgrounds',
  'A set of technical visual prompts ready for image generation.'
) ON CONFLICT (id) DO NOTHING;
