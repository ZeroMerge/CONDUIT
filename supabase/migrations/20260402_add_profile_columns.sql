-- Migration: Add missing columns for vibrant colors and audit tracking
-- Run this in your Supabase SQL Editor if you see 400 Bad Request on Profile Update

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_bg_color TEXT DEFAULT 'transparent',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
