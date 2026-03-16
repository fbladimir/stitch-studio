-- ============================================================
-- Phase 18 — Pattern Markup / Grid Viewer
-- Run this in Supabase SQL Editor
-- Safe to re-run — uses IF NOT EXISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS pattern_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chart_photo_url TEXT,
  grid_cols INTEGER NOT NULL,
  grid_rows INTEGER NOT NULL,
  calibration JSONB,
  marked_cells TEXT DEFAULT '',  -- bitfield string for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pattern_markups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pattern_markups' AND policyname = 'Users access own markups'
  ) THEN
    CREATE POLICY "Users access own markups" ON pattern_markups
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pattern_markups_pattern ON pattern_markups(pattern_id);

-- Storage bucket for chart photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('chart-photos', 'chart-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'chart-photos public read'
  ) THEN
    CREATE POLICY "chart-photos public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'chart-photos');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'chart-photos auth upload'
  ) THEN
    CREATE POLICY "chart-photos auth upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'chart-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'chart-photos auth update'
  ) THEN
    CREATE POLICY "chart-photos auth update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'chart-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'chart-photos auth delete'
  ) THEN
    CREATE POLICY "chart-photos auth delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'chart-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;
