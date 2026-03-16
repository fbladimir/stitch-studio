-- ============================================================
-- Phase 17 — Stitching Mode (R-XP Replacement)
-- Run this in Supabase SQL Editor
-- Safe to re-run — uses IF NOT EXISTS
-- ============================================================

-- Stitch sessions (timer + stitch tracking per session)
CREATE TABLE IF NOT EXISTS stitch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  stitches_completed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stitch_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stitch_sessions' AND policyname = 'Users access own sessions'
  ) THEN
    CREATE POLICY "Users access own sessions" ON stitch_sessions
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stitch_sessions_pattern ON stitch_sessions(pattern_id);
CREATE INDEX IF NOT EXISTS idx_stitch_sessions_user ON stitch_sessions(user_id);

-- Progress photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES stitch_sessions(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'progress_photos' AND policyname = 'Users access own progress photos'
  ) THEN
    CREATE POLICY "Users access own progress photos" ON progress_photos
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_progress_photos_pattern ON progress_photos(pattern_id);

-- Daily stitch target on patterns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patterns' AND column_name = 'daily_stitch_target'
  ) THEN
    ALTER TABLE patterns ADD COLUMN daily_stitch_target INTEGER DEFAULT 0;
  END IF;
END $$;

-- Storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for progress-photos bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'progress-photos public read'
  ) THEN
    CREATE POLICY "progress-photos public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'progress-photos');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'progress-photos auth upload'
  ) THEN
    CREATE POLICY "progress-photos auth upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'progress-photos auth update'
  ) THEN
    CREATE POLICY "progress-photos auth update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'progress-photos auth delete'
  ) THEN
    CREATE POLICY "progress-photos auth delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;
