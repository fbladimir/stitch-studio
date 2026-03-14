-- ============================================================
-- Stitch Studio — Complete Supabase Setup SQL
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query)
-- Safe to re-run: uses IF NOT EXISTS and DROP IF EXISTS throughout.
-- ============================================================


-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  dogs JSONB DEFAULT '[]',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patterns, charts, embroidery, kits (unified table with type column)
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'cross_stitch',
  name TEXT NOT NULL,
  designer TEXT,
  company TEXT,
  size_inches TEXT,
  size_stitches TEXT,
  rec_thread_brand TEXT,
  rec_fabric TEXT,
  chart_type TEXT,
  magazine_name TEXT,
  magazine_issue TEXT,
  magazine_month_year TEXT,
  cover_photo_url TEXT,
  notes TEXT,
  kitted BOOLEAN DEFAULT FALSE,
  kitted_date TIMESTAMPTZ,
  wip BOOLEAN DEFAULT FALSE,
  wip_pct INTEGER DEFAULT 0 CHECK (wip_pct >= 0 AND wip_pct <= 100),
  wip_stitches INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  last_progress_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  days_to_complete INTEGER,
  fo_photo_url TEXT,
  ffo_photo_url TEXT,
  kit_contents JSONB,
  kit_status TEXT,
  stitch_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threads required by a pattern (one row per thread color)
CREATE TABLE IF NOT EXISTS pattern_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  manufacturer TEXT,
  color_number TEXT,
  color_name TEXT,
  strands TEXT,
  stitch_type TEXT,
  skeins_needed INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- Thread inventory (physical threads she owns)
CREATE TABLE IF NOT EXISTS thread_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  color_number TEXT,
  color_name TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  thread_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fabric inventory (physical fabrics she owns)
CREATE TABLE IF NOT EXISTS fabric_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  manufacturer TEXT,
  color_name TEXT,
  size TEXT,
  count TEXT,
  fabric_type TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WIP progress journal (optional timestamped notes per update)
CREATE TABLE IF NOT EXISTS wip_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  pct_at_time INTEGER,
  stitches_at_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping list (from kitting checks, persisted)
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  item_type TEXT,
  manufacturer TEXT,
  color_number TEXT,
  color_name TEXT,
  quantity_needed INTEGER DEFAULT 1,
  quantity_have INTEGER DEFAULT 0,
  acquired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- SECTION 2: AUTO-CREATE PROFILE TRIGGER
-- Creates a profile row automatically when a new user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 3: ROW LEVEL SECURITY
-- Enables RLS and creates access policies on all core tables.
-- Every user can only access their own data.
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users access own profile" ON profiles;
CREATE POLICY "Users access own profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- patterns
DROP POLICY IF EXISTS "Users access own patterns" ON patterns;
CREATE POLICY "Users access own patterns" ON patterns
  FOR ALL USING (user_id = auth.uid());

-- pattern_threads (scoped through pattern ownership)
DROP POLICY IF EXISTS "Users access own pattern_threads" ON pattern_threads;
CREATE POLICY "Users access own pattern_threads" ON pattern_threads
  FOR ALL USING (
    pattern_id IN (SELECT id FROM patterns WHERE user_id = auth.uid())
  );

-- thread_inventory
DROP POLICY IF EXISTS "Users access own thread_inventory" ON thread_inventory;
CREATE POLICY "Users access own thread_inventory" ON thread_inventory
  FOR ALL USING (user_id = auth.uid());

-- fabric_inventory
DROP POLICY IF EXISTS "Users access own fabric_inventory" ON fabric_inventory;
CREATE POLICY "Users access own fabric_inventory" ON fabric_inventory
  FOR ALL USING (user_id = auth.uid());

-- wip_journal
DROP POLICY IF EXISTS "Users access own wip_journal" ON wip_journal;
CREATE POLICY "Users access own wip_journal" ON wip_journal
  FOR ALL USING (user_id = auth.uid());

-- shopping_list
DROP POLICY IF EXISTS "Users access own shopping_list" ON shopping_list;
CREATE POLICY "Users access own shopping_list" ON shopping_list
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- SECTION 4: STORAGE — MAKE BUCKETS PUBLIC + POLICIES
-- CRITICAL: getPublicUrl() only returns accessible URLs when
-- the bucket itself has public=true set at the bucket level.
-- RLS policies alone are not enough. Run both parts below.
-- ============================================================

-- Part A: Set all photo buckets to public (THIS IS THE KEY FIX)
-- This is what makes getPublicUrl() actually return accessible URLs.
UPDATE storage.buckets
SET public = true
WHERE id IN (
  'pattern-covers',
  'fo-photos',
  'ffo-photos',
  'profile-photos',
  'fabric-photos',
  'thread-photos',
  'kit-photos'
);

-- Part B: RLS policies — public read + auth upload/update/delete

-- pattern-covers
DROP POLICY IF EXISTS "Public read pattern-covers" ON storage.objects;
CREATE POLICY "Public read pattern-covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'pattern-covers');

DROP POLICY IF EXISTS "Auth upload pattern-covers" ON storage.objects;
CREATE POLICY "Auth upload pattern-covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pattern-covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update pattern-covers" ON storage.objects;
CREATE POLICY "Auth update pattern-covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pattern-covers' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete pattern-covers" ON storage.objects;
CREATE POLICY "Auth delete pattern-covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'pattern-covers' AND auth.uid() IS NOT NULL);

-- fo-photos
DROP POLICY IF EXISTS "Public read fo-photos" ON storage.objects;
CREATE POLICY "Public read fo-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fo-photos');

DROP POLICY IF EXISTS "Auth upload fo-photos" ON storage.objects;
CREATE POLICY "Auth upload fo-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fo-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update fo-photos" ON storage.objects;
CREATE POLICY "Auth update fo-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fo-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete fo-photos" ON storage.objects;
CREATE POLICY "Auth delete fo-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fo-photos' AND auth.uid() IS NOT NULL);

-- ffo-photos
DROP POLICY IF EXISTS "Public read ffo-photos" ON storage.objects;
CREATE POLICY "Public read ffo-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'ffo-photos');

DROP POLICY IF EXISTS "Auth upload ffo-photos" ON storage.objects;
CREATE POLICY "Auth upload ffo-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ffo-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update ffo-photos" ON storage.objects;
CREATE POLICY "Auth update ffo-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'ffo-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete ffo-photos" ON storage.objects;
CREATE POLICY "Auth delete ffo-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'ffo-photos' AND auth.uid() IS NOT NULL);

-- profile-photos
DROP POLICY IF EXISTS "Public read profile-photos" ON storage.objects;
CREATE POLICY "Public read profile-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Auth upload profile-photos" ON storage.objects;
CREATE POLICY "Auth upload profile-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update profile-photos" ON storage.objects;
CREATE POLICY "Auth update profile-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete profile-photos" ON storage.objects;
CREATE POLICY "Auth delete profile-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

-- fabric-photos
DROP POLICY IF EXISTS "Public read fabric-photos" ON storage.objects;
CREATE POLICY "Public read fabric-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fabric-photos');

DROP POLICY IF EXISTS "Auth upload fabric-photos" ON storage.objects;
CREATE POLICY "Auth upload fabric-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fabric-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update fabric-photos" ON storage.objects;
CREATE POLICY "Auth update fabric-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fabric-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete fabric-photos" ON storage.objects;
CREATE POLICY "Auth delete fabric-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fabric-photos' AND auth.uid() IS NOT NULL);

-- thread-photos
DROP POLICY IF EXISTS "Public read thread-photos" ON storage.objects;
CREATE POLICY "Public read thread-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'thread-photos');

DROP POLICY IF EXISTS "Auth upload thread-photos" ON storage.objects;
CREATE POLICY "Auth upload thread-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thread-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update thread-photos" ON storage.objects;
CREATE POLICY "Auth update thread-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'thread-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete thread-photos" ON storage.objects;
CREATE POLICY "Auth delete thread-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'thread-photos' AND auth.uid() IS NOT NULL);

-- kit-photos
DROP POLICY IF EXISTS "Public read kit-photos" ON storage.objects;
CREATE POLICY "Public read kit-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'kit-photos');

DROP POLICY IF EXISTS "Auth upload kit-photos" ON storage.objects;
CREATE POLICY "Auth upload kit-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kit-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update kit-photos" ON storage.objects;
CREATE POLICY "Auth update kit-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'kit-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth delete kit-photos" ON storage.objects;
CREATE POLICY "Auth delete kit-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'kit-photos' AND auth.uid() IS NOT NULL);


-- ============================================================
-- SECTION 5: PHASE 13 SCHEMA ADDITIONS
-- Tutorial onboarding columns — safe to run now, used in Phase 13
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_skipped_at TIMESTAMPTZ;


-- ============================================================
-- SECTION 6: PHASE 15 SCHEMA ADDITIONS
-- Engagement & Delight system — safe to run now, used in Phase 15
-- ============================================================

-- Add engagement columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_used_this_week BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freeze_week_start DATE;

-- Achievements earned table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Monthly challenge progress table
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  month TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  goal INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id, month)
);

-- Enable RLS on Phase 15 tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own achievements" ON achievements;
CREATE POLICY "Users access own achievements" ON achievements
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users access own challenge_progress" ON challenge_progress;
CREATE POLICY "Users access own challenge_progress" ON challenge_progress
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- ALL DONE — If no errors above, your Supabase project is
-- fully set up and ready for all phases of Stitch Studio.
-- ============================================================
