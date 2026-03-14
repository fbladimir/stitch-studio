-- ============================================================
-- Stitch Studio — Phase 15: Engagement & Delight System
-- Run this in the Supabase SQL Editor AFTER the base setup.
-- Safe to re-run: uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- ── Add engagement columns to profiles ──────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_used_this_week BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freeze_week_start DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_skipped_at TIMESTAMPTZ;

-- ── Achievements table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS policy for achievements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Users access own achievements'
  ) THEN
    CREATE POLICY "Users access own achievements" ON achievements
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Monthly challenge progress table ────────────────────────
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  month TEXT NOT NULL,  -- '2026-03'
  progress INTEGER DEFAULT 0,
  goal INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id, month)
);

ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS policy for challenge_progress
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challenge_progress' AND policyname = 'Users access own challenge progress'
  ) THEN
    CREATE POLICY "Users access own challenge progress" ON challenge_progress
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Indexes for performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_month ON challenge_progress(user_id, month);
