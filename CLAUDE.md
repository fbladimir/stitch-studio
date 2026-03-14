# CLAUDE.md — Stitch Studio
# Cross Stitch Companion App for Mom
# Last Updated: 2026-03-14 (Session 12)

---

## ⚡ START-OF-CHAT PROMPT
> Copy and paste this at the beginning of EVERY new Claude Dev session.

```
Please read CLAUDE.md in full before doing anything else. It contains the full project context,
tech stack, feature list, database schema, design system, and a progress log of everything built
so far. After reading it, write a 2–3 sentence summary of what has been completed and what we are
working on next. Then wait for my instructions before writing any code.
```

---

## ⚡ END-OF-CHAT PROMPT
> Copy and paste this when approaching context limit or finishing a session.

```
Before we end this session: please update CLAUDE.md with everything we completed today. Mark
finished features as DONE, mark in-progress items as IN PROGRESS with a note on exactly where
we stopped, and add any new decisions, schema changes, or component names introduced this session.
Then write a one-paragraph Handoff Note at the top of the Progress Log section so the next session
knows exactly where to pick up. Save the file before we close.
```

---

## 🧭 PROJECT OVERVIEW

**App Name:** Stitch Studio
**Purpose:** A premium mobile-first web app for a woman in her 60s who does cross stitch,
needlepoint, and embroidery. She has a large collection of patterns/charts, threads, fabrics,
and kits that she needs to inventory, track, and manage. The app replaces Notion and eliminates
manual upfront data entry by using AI (Claude API) to read photos of patterns and color keys.

**Primary Users:**
- Mom — iPhone (primary), iPad, Amazon Kindle Fire
- Frank — developer, occasional admin access

**Design Principle:** Premium, warm, crafting-aesthetic UI/UX. Think high-end journaling app
meets crafting companion. Feels like it was made just for her. She is 60+ but tech-savvy —
she uses apps daily. Do NOT dumb it down. DO make it intuitive, beautiful, and frictionless.
Zero tolerance for clunky flows or confusing labels.

**Core Value Proposition (confirmed by Mom):**
- The app IS her visual database. She wants to SEE her entire collection — every pattern with
  its cover photo, every thread in her stash, every fabric — browsable, searchable, filterable.
  Think of it like a beautiful personal library she can flip through. When she says "database"
  she means: "I want to see all my stuff organized in one beautiful place I can actually browse."
- AI cover page scanning is critical to her workflow. She does NOT want to type in pattern names,
  designer names, sizes manually. She photographs the cover → app fills everything in → she confirms.
  This is the #1 friction reducer for building her collection. (Planned: Phase 9)
- She currently uses R-XP for cross stitch and wants to bring that data in without re-entry.
  Other users in the community use PatternKeeper and Saga. Import support planned in Phase 14.

**Device Priority (in order):**
1. iPhone (primary — Safari, PWA installable)
2. iPad (tablet layout — two-column where it makes sense)
3. Amazon Kindle Fire (Silk browser, touch-first, lower resolution)

---

## 🛠 TECH STACK

| Layer             | Technology                        | Notes                                          |
|-------------------|-----------------------------------|------------------------------------------------|
| Framework         | Next.js 14+ (App Router)          | React-based, SSR, API routes                   |
| Language          | TypeScript (strict mode)          | No any types                                   |
| Styling           | Tailwind CSS                      | Mobile-first utility classes                   |
| Components        | shadcn/ui                         | Copy-paste, fully customizable                 |
| Database          | Supabase (PostgreSQL)             | Auth + DB + Storage                            |
| Auth              | Supabase Auth                     | Email + Password with easy onboarding flow     |
| File Storage      | Supabase Storage                  | Photos for patterns, threads, fabric, FO/FFO   |
| AI                | Anthropic Claude API              | Model: claude-sonnet-4-5                       |
| Image Capture     | Native browser API                | Camera + file upload — BOTH always available   |
| PWA               | next-pwa                          | Installable on iPhone home screen + Kindle     |
| Hosting           | Vercel                            | CI/CD from GitHub                              |
| State             | Zustand                           | Lightweight global state                       |
| Forms             | React Hook Form + Zod             | Validation on all forms                        |
| Geolocation       | Browser Geolocation API           | For in-store shopping assistant                |
| Maps              | Google Maps Places API            | Find nearby craft stores                       |

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

---

## 🔐 AUTH APPROACH

Auth uses **Supabase Auth with Email + Password**. The onboarding must be dead simple:

**Why NOT Magic Link:**
Mom needs a persistent account that saves all her data (hundreds of patterns, threads,
fabrics, photos). A real account with email + password gives her reliable access across
all her devices (iPhone, iPad, Kindle) and ensures her data is always tied to her account.

**How to keep it easy:**
- Sign-up screen: only 3 fields — Name, Email, Password
- Password requirements: minimum 8 characters only. No special character nonsense.
- Show/hide password toggle always visible
- "Remember me" is ON by default — she should almost never have to log in again
- Persistent session — Supabase handles token refresh automatically
- Password reset: simple "Forgot password?" → email link → reset form
- No email verification gate — let her into the app immediately after signup

**Onboarding flow (after account created, first time only):**
- Step 1: "What should we call you?" — display name (pre-filled from signup)
- Step 2: Profile photo — camera OR upload, fully optional with a visible Skip button
- Step 3: "Introduce your fur babies!" — add dog names, emoji selector, fully optional
- After Step 3 (or any Skip): lands on Home dashboard

---

## 📱 DEVICE & PWA REQUIREMENTS

**iPhone (Safari):**
- `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`
- Safe area insets for notch and home bar: `env(safe-area-inset-bottom)`
- Bottom nav must clear the home bar
- Test: iPhone SE (small), iPhone 14 Pro (notch), iPhone 15 Pro Max (large)

**iPad:**
- Single column on phone (< 768px)
- Two-column layout on tablet (>= 768px) for list + detail views
- Bottom nav becomes side nav on iPad

**Amazon Kindle Fire (Silk Browser):**
- Chromium-based but older engine — test for CSS compatibility
- Touch targets minimum 48x48px everywhere, no exceptions
- No hover-only states — Kindle has no hover
- Avoid web fonts that require fast CDN — use font-display: swap and good fallbacks
- Test at 1024x600 resolution (Fire HD 8) and 1280x800 (Fire HD 10)
- Avoid position: fixed inside scrollable containers — Silk handles this poorly

**PWA:**
- Installable to iPhone/iPad home screen (Safari Add to Home Screen)
- On first visit show a gentle install prompt banner explaining how to add to home screen
  (iOS does not support native install prompt — must be manual instruction)
- Service worker via next-pwa
- Manifest: app name, icons all sizes, theme color (#FAF6F0), background color (#FAF6F0)
- Offline: show cached data read-only, queue writes for when connection returns
- App icon: needle and thread or cross stitch hoop — warm rose/terracotta color

---

## 🗂 FEATURES — COMPLETE SPECIFICATION

---

### ONBOARDING (3 screens maximum)

**Screen 1 — Create Account:**
- App logo + "Stitch Studio" name large
- Name field, Email field, Password field (show/hide toggle)
- "Create Account" button (full width, prominent)
- Below: "Already have an account? Sign in"
- No email verification gate — go straight in

**Screen 2 — Profile Photo (optional):**
- Large circle avatar placeholder with camera icon
- Two buttons side by side: "Take Photo" | "Choose from Library"
- Large "Skip for now →" text link below
- Warm encouraging copy: "Add a photo so we know it's you!"

**Screen 3 — Your Fur Babies (optional):**
- Headline: "Got pets? Tell us about them! 🐾"
- Add dog by typing name + selecting an emoji (dog, cat, bird, etc.)
- Each added pet appears as a cute pill/chip that can be removed
- Large "All done! Let's stitch →" button
- "Skip" text link also visible

---

### HOME DASHBOARD

- Greeting: "Good morning, [Name]! ✿" (time-appropriate)
- Dog names shown: "Rex & Bella send tail wags 🐾"
- Stats row: Total Patterns | WIPs | Finished | Threads in Stash
- Quick Actions grid (2x2):
  - 📸 Scan New Pattern
  - 🧺 Kitting Check
  - ⏱️ Log Progress
  - 🛍️ I'm Shopping!
- Recent Patterns: last 3 touched, with cover photo thumbnail + status badge
- WIP reminder: if any WIP has no update in 7+ days, show gentle nudge card

---

### PATTERN / CHART INVENTORY

Each pattern record contains all of the following:

**Basic Info:**
- Pattern/Chart Name (required)
- Designer Name
- Company/Publisher
- Design Size in Inches (e.g. "14 x 14")
- Design Size in Stitches (e.g. "196 x 196")
- Recommended Thread Brand (dropdown: DMC, Anchor, Weeks Dye Works, Gentle Arts,
  Classic Colorworks, Simply Shaker, Cosmos, Sulky, Silk, Rayon, Other)
- Recommended Fabric + Count (e.g. "14 Count AIDA White")
- Chart Type: Paper / PDF / Magazine / Digital Download
  - If Magazine selected: show Magazine Name + Issue Number + Month/Year fields
- Cover Photo — always show both: "Take Photo" button + "Choose from Library" button
- Notes (free text, multi-line)

**Thread List (per pattern):**
- All threads required for this specific pattern
- Each thread entry: Manufacturer, Color Number, Color Name, Strands, Stitch Type
  (Full Stitch / Backstitch / French Knot / Other), Skeins Needed
- AI can extract this from a color key photo automatically
- Manual add, edit, remove always available regardless of AI

**Status Tracking:**
- Kitted (toggle): She has gathered all supplies for this pattern
- Work in Progress / WIP (toggle):
  - Enabling WIP auto-logs the start date (editable)
  - WIP stats: % complete slider (0–100), stitches completed number
  - Progress bar visualization
  - WIP notes/journal: optional timestamped notes per update
- Finished (toggle):
  - Auto-logs completion date
  - Displays: days to complete, start date, completion date
  - FO (Finished Object) photo — camera + upload
  - FFO (Fully Finished Object) photo — camera + upload (framed/mounted version)

**Duplicate Detection:**
When adding any new pattern (manually or via AI scan), query the database for:
- Exact name match (case-insensitive)
- Same designer + similar name (fuzzy match)
Show a warning modal with preview of the existing record.
Let her proceed anyway or cancel. This solves the "bought same chart twice" problem.

---

### KIT INVENTORY (pre-kitted kits she buys)

These are kits that come as a complete ready-to-stitch package:

- Kit Name
- Brand/Manufacturer
- Kit Type: Cross Stitch / Embroidery / Other
- Contents Included (checkboxes): Fabric / Threads / Needle / Pattern / Other
- Photo of Kit packaging — camera + upload
- Status: Unopened / Started / Finished
- If Started: same WIP tracking as patterns (%, stitches, dates, notes)
- If Finished: completion date, FO photo, FFO photo
- Notes

---

### EMBROIDERY PATTERNS & KITS

Separate section from cross stitch — embroidery has different characteristics:

- Pattern Name, Designer, Company
- Stitch Types Used (free-form: satin stitch, chain stitch, stem stitch, etc.)
- Thread Types: Stranded Cotton / Perle Cotton / Wool / Silk / Mixed
- Fabric: Linen / Cotton / Interfaced / Hoop frame / Other
- Kit vs. Standalone Pattern toggle
- Status: Not Started / WIP / Finished
- WIP tracking identical to cross stitch patterns
- Cover photo, FO photo, FFO photo — camera + upload
- Notes

---

### THREAD INVENTORY (what she physically owns)

- Manufacturer (DMC, Anchor, Weeks Dye Works, Gentle Arts, Classic Colorworks,
  Simply Shaker, Cosmos, Sulky, Other)
- Color Number
- Color Name
- Quantity in Skeins (integer, adjustable with +/- buttons)
- Thread Type: Cotton / Silk / Rayon / Wool / Perle / Blended / Other
- Notes
- AI bulk-import: photograph thread collection or label → AI reads numbers + names

**Cross-reference:** From any thread entry, show a list of patterns that require that thread.

---

### FABRIC INVENTORY (what she physically owns)

- Manufacturer (Zweigart, Charles Craft, Wichelt, Fabric Flair, DMC, Other)
- Color Name / Colorway description
- Size (e.g. "9x10 inches", "12x18 inches")
- Fabric Count (14, 16, 18, 20, 22, 25, 28, 32, 36)
- Fabric Type (AIDA, Linen, Evenweave, Other)
- Photo — camera + upload
- Notes

---

### KITTING CHECK (AI-Powered)

The core "magic" workflow that ties everything together:

1. She selects a pattern from her inventory
2. App compares pattern's required thread list vs. her thread inventory
3. App checks pattern's recommended fabric vs. her fabric inventory
4. Results displayed clearly:
   - GREEN: "You have everything you need! Ready to kit." → button to mark Kitted
   - ORANGE: Shopping list of exactly what she's missing (brand, number, color, skeins)
5. Thread substitution: for any missing thread she can tap "Substitute" and either:
   - Choose a thread from her stash that AI suggests as a substitute
   - Ask AI advisor: "What can I use instead of DMC 304?"
6. Once happy: mark the pattern as Kitted with optional fabric selection from her inventory

---

### AI FEATURES (All via Next.js API routes — never call Anthropic from client)

**1. Cover Page Scanner**
- She photographs a pattern cover page (camera or upload, both always available)
- Claude Vision reads: pattern name, designer, company, size in inches, size in stitches,
  recommended thread brand, recommended fabric, chart type, copyright notice
- Pre-fills the pattern entry form — she reviews and confirms before saving
- Handles angled, imperfect, partially lit photos gracefully
- Show a "Looks right? Let's save it" confirmation screen

**2. Color Key / Thread List Scanner**
- She photographs the color key or thread list page from a pattern
- Claude extracts: all thread numbers, color names, manufacturer, stitch type, strands, skeins
- Handles: DMC, Anchor, Weeks Dye Works, Gentle Arts, Simply Shaker, Classic Colorworks, Cosmos
- Works even if photo contains symbols she doesn't care about — just pulls thread data
- Results shown in a reviewable list before adding to the pattern

**3. Stash Scanner (Bulk Thread Import)**
- She photographs her thread storage, a thread card, or a labeled organizer
- AI reads manufacturer + color numbers visible in the photo
- Bulk-adds to thread inventory with quantity defaulting to 1 (adjustable before saving)

**4. AI Stitch Advisor (Chat)**
- Free-form conversational chat with a knowledgeable, warm cross stitch advisor
- Context-aware: Claude is given her stash, patterns, WIPs as context
- Use cases:
  - "What can I substitute for DMC 3865 from what I have?"
  - "How do I frame a finished piece on linen?"
  - "What fabric count should I use for a 196x196 stitch design?"
  - "Is DMC or Anchor better for backstitching on linen?"
  - "How do I wash a finished cross stitch?"
  - General crafting and technique advice
- Streaming response (shows text as it arrives)
- Pre-built quick question chips for common queries

**5. Kitting Substitution Suggest**
- Given a missing thread, suggest substitutes from her current stash
- Explain why the substitute works (color family, value, fiber type)

**API Route Structure:**
```
POST /api/ai/scan-cover       → Claude Vision, returns pattern fields JSON
POST /api/ai/scan-colorkey    → Claude Vision, returns threads array JSON
POST /api/ai/scan-stash       → Claude Vision, returns threads array JSON
POST /api/ai/scan-fabric      → Claude Vision, returns fabric fields JSON
POST /api/ai/advisor          → Claude chat, streaming SSE response
POST /api/ai/kitting-suggest  → Claude chat, returns substitution suggestions JSON
```

**Image handling before any API call:**
Compress client-side to max 1200px wide, JPEG quality 80%, before uploading or sending to Claude.
Never send raw full-resolution photos to the API.

---

### IN-STORE SHOPPING ASSISTANT

Mom's real problem: She's at a craft store, can't remember what she owns, and has bought the
same chart multiple times by mistake.

**Entry:** "🛍️ I'm Shopping!" button on Home dashboard — always visible, max 2 taps from anywhere.

**Store Mode UI:** Full-screen takeover. Large text. High contrast. Designed for bright store
lighting. Single-purpose focused interface. Easy "← Back to Stitch Studio" exit.

**What she can do in Store Mode:**

1. **Scan a Chart Cover** — tap camera → photograph the chart cover on the shelf →
   AI reads name + designer → instant result:
   - "✅ You already have this one!" with her existing record (status, kitted, finished)
   - "🆕 This is new to your collection!" with option to add it right now
   - "⚠️ This might be a duplicate" (fuzzy match warning)

2. **Quick Thread Check** — type a DMC number or color name → instant yes/no from her inventory
   with quantity shown ("You have 3 skeins")

3. **Quick Fabric Check** — filter by count + size → shows what she has

4. **My Shopping List** — threads and fabrics flagged as needed from all her kitting checks,
   grouped by store section (all DMC threads together, etc.)

5. **Nearby Stores Tab:**
   - Requests geolocation (asks gracefully with a clear explanation why)
   - Shows nearby: Michael's, Hobby Lobby, Jo-Ann, independent needlework specialty shops
   - Uses Google Maps Places API (Nearby Search)
   - Shows: store name, distance, address, hours, phone
   - Tap to open in Apple Maps / Google Maps
   - Filter toggle: "Needlework specialty shops only"
   - Cache results for 1 hour — do not spam Places API

**Duplicate Chart Detection (also runs outside Store Mode):**
Every time a new pattern is added (manually, via scan, or in-store):
- Query existing patterns: exact name match + fuzzy designer+name match
- If match found: show warning modal with thumbnail of existing entry
- She can proceed anyway or cancel
- This is the primary solution to the "bought it twice" problem

---

## 🗄 DATABASE SCHEMA (Supabase / PostgreSQL)

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  dogs JSONB DEFAULT '[]',  -- [{id, name, emoji}]
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patterns, charts, embroidery, kits — unified table with type column
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'cross_stitch',
  -- type options: 'cross_stitch' | 'embroidery' | 'kit_cross_stitch' | 'kit_embroidery'
  name TEXT NOT NULL,
  designer TEXT,
  company TEXT,
  size_inches TEXT,
  size_stitches TEXT,
  rec_thread_brand TEXT,
  rec_fabric TEXT,
  chart_type TEXT,  -- 'paper' | 'pdf' | 'magazine' | 'digital'
  magazine_name TEXT,
  magazine_issue TEXT,
  magazine_month_year TEXT,
  cover_photo_url TEXT,
  notes TEXT,
  -- Status
  kitted BOOLEAN DEFAULT FALSE,
  kitted_date TIMESTAMPTZ,
  wip BOOLEAN DEFAULT FALSE,
  wip_pct INTEGER DEFAULT 0 CHECK (wip_pct >= 0 AND wip_pct <= 100),
  wip_stitches INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  last_progress_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  days_to_complete INTEGER,  -- computed on finish
  fo_photo_url TEXT,
  ffo_photo_url TEXT,
  -- Kit-specific
  kit_contents JSONB,  -- {fabric: bool, threads: bool, needle: bool, pattern: bool, other: str}
  kit_status TEXT,     -- 'unopened' | 'started' | 'finished'
  -- Embroidery-specific
  stitch_types TEXT[],
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threads required by a pattern (one row per thread color)
CREATE TABLE pattern_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  manufacturer TEXT,
  color_number TEXT,
  color_name TEXT,
  strands TEXT,
  stitch_type TEXT,   -- 'full' | 'backstitch' | 'french_knot' | 'other'
  skeins_needed INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- Thread inventory (physical threads she owns)
CREATE TABLE thread_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  color_number TEXT,
  color_name TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  thread_type TEXT,  -- 'cotton' | 'silk' | 'rayon' | 'wool' | 'perle' | 'blended' | 'other'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fabric inventory (physical fabrics she owns)
CREATE TABLE fabric_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  manufacturer TEXT,
  color_name TEXT,
  size TEXT,
  count TEXT,          -- '14' | '16' | '18' | '20' | '22' | '25' | '28' | '32' | '36'
  fabric_type TEXT,    -- 'aida' | 'linen' | 'evenweave' | 'other'
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WIP progress journal (optional timestamped notes per update)
CREATE TABLE wip_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  pct_at_time INTEGER,
  stitches_at_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping list items (from kitting checks, persisted)
CREATE TABLE shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  item_type TEXT,  -- 'thread' | 'fabric'
  manufacturer TEXT,
  color_number TEXT,
  color_name TEXT,
  quantity_needed INTEGER DEFAULT 1,
  quantity_have INTEGER DEFAULT 0,
  acquired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Phase 15 additions to profiles table:**
```sql
ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_activity_date DATE;
ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN streak_freeze_used_this_week BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN freeze_week_start DATE;
ALTER TABLE profiles ADD COLUMN tutorial_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN tutorial_skipped_at TIMESTAMPTZ;
```

**Phase 15 new tables:**
```sql
-- Achievements earned
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Monthly challenge progress
CREATE TABLE challenge_progress (
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
```

**Row Level Security — enable on ALL tables:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

-- Example policy (repeat for each table):
CREATE POLICY "Users access own data" ON patterns
  FOR ALL USING (user_id = auth.uid());
```

**Supabase Storage Buckets:**
```
pattern-covers    (private, signed URLs)
fo-photos         (private, signed URLs)
ffo-photos        (private, signed URLs)
thread-photos     (private, signed URLs)
fabric-photos     (private, signed URLs)
profile-photos    (private, signed URLs)
kit-photos        (private, signed URLs)
```

---

## 📁 PROJECT FOLDER STRUCTURE

```
stitch-studio/
├── CLAUDE.md                          ← this file — always keep updated
├── .env.local                         ← secrets (gitignored)
├── .gitignore
├── next.config.js                     ← next-pwa config here
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   ├── manifest.json                  ← PWA manifest
│   ├── icons/                         ← PWA icons: 72,96,128,144,152,192,384,512px
│   └── screenshots/                   ← PWA install screenshots (optional)
│
└── src/
    ├── app/
    │   ├── layout.tsx                 ← root layout, fonts, meta tags, safe area
    │   ├── globals.css                ← CSS variables, Tailwind base
    │   ├── page.tsx                   ← redirects: authed→/dashboard, unauthed→/auth
    │   │
    │   ├── auth/
    │   │   ├── page.tsx               ← sign in / sign up tabs
    │   │   └── reset-password/page.tsx
    │   │
    │   ├── onboarding/
    │   │   └── page.tsx               ← 3-step onboarding wizard
    │   │
    │   ├── dashboard/
    │   │   └── page.tsx               ← home dashboard
    │   │
    │   ├── patterns/
    │   │   ├── page.tsx               ← patterns list + filter + search
    │   │   ├── new/page.tsx           ← add new pattern form
    │   │   └── [id]/
    │   │       ├── page.tsx           ← pattern detail view
    │   │       └── edit/page.tsx      ← edit pattern form
    │   │
    │   ├── kits/
    │   │   ├── page.tsx
    │   │   ├── new/page.tsx
    │   │   └── [id]/page.tsx
    │   │
    │   ├── embroidery/
    │   │   ├── page.tsx
    │   │   ├── new/page.tsx
    │   │   └── [id]/page.tsx
    │   │
    │   ├── threads/
    │   │   └── page.tsx
    │   │
    │   ├── fabrics/
    │   │   └── page.tsx
    │   │
    │   ├── kitting/
    │   │   └── page.tsx               ← kitting check flow (select pattern → compare → result)
    │   │
    │   ├── store-mode/
    │   │   └── page.tsx               ← in-store shopping assistant
    │   │
    │   ├── profile/
    │   │   └── page.tsx               ← profile page (avatar, level, XP, streaks, achievements, sign out)
    │   │
    │   ├── ai/
    │   │   └── page.tsx               ← AI advisor chat + scan tools (3 tabs: Advisor/Scan/Stash)
    │   │
    │   └── api/
    │       ├── ai/
    │       │   ├── scan-cover/route.ts
    │       │   ├── scan-colorkey/route.ts
    │       │   ├── scan-stash/route.ts
    │       │   ├── scan-fabric/route.ts   ← Claude Vision, fabric identification
    │       │   ├── advisor/route.ts       ← streaming SSE
    │       │   └── kitting-suggest/route.ts
    │       └── places/
    │           └── nearby/route.ts       ← Google Maps Places text search proxy, haversine distance
    │
    ├── components/
    │   ├── ui/                          ← shadcn/ui components (auto-generated)
    │   │
    │   ├── layout/
    │   │   ├── BottomNav.tsx            ← mobile bottom navigation
    │   │   ├── SideNav.tsx              ← iPad side navigation
    │   │   ├── TopBar.tsx               ← page header with back button
    │   │   └── PageWrapper.tsx          ← safe area + padding wrapper
    │   │
    │   ├── auth/
    │   │   ├── SignInForm.tsx
    │   │   ├── SignUpForm.tsx
    │   │   └── ResetPasswordForm.tsx
    │   │
    │   ├── onboarding/
    │   │   ├── OnboardingWizard.tsx
    │   │   ├── Step1Name.tsx
    │   │   ├── Step2Photo.tsx
    │   │   └── Step3Dogs.tsx
    │   │
    │   ├── patterns/
    │   │   ├── PatternCard.tsx
    │   │   ├── PatternForm.tsx
    │   │   ├── PatternDetail.tsx
    │   │   ├── ThreadList.tsx           ← per-pattern thread list editor
    │   │   ├── StatusToggles.tsx        ← Kitted / WIP / Finished toggles
    │   │   ├── WipTracker.tsx           ← progress %, stitches, dates
    │   │   ├── WipJournal.tsx           ← timestamped notes
    │   │   └── DuplicateWarning.tsx     ← modal shown when duplicate detected
    │   │
    │   ├── threads/
    │   │   ├── ThreadCard.tsx
    │   │   ├── ThreadForm.tsx
    │   │   └── ThreadInventoryList.tsx
    │   │
    │   ├── fabrics/
    │   │   ├── FabricCard.tsx
    │   │   ├── FabricForm.tsx
    │   │   └── FabricInventoryList.tsx
    │   │
    │   ├── ai/
    │   │   ├── PhotoScanner.tsx         ← SHARED: camera + upload, preview, compress
    │   │   ├── AdvisorChat.tsx          ← streaming chat UI
    │   │   ├── KittingResult.tsx        ← have / need / shopping list display
    │   │   └── SubstitutionHelper.tsx
    │   │
    │   ├── engagement/
    │   │   ├── CelebrationOverlay.tsx   ← full-screen confetti + dog parade + celebration copy
    │   │   ├── StreakCard.tsx           ← dashboard 🔥 streak display, tap for detail
    │   │   ├── StreakDetail.tsx         ← bottom sheet: current/longest, week dots, milestones
    │   │   ├── AchievementBadge.tsx     ← single badge (earned/locked states)
    │   │   ├── AchievementShelf.tsx     ← full grid of all 22 badges by category
    │   │   ├── ChallengeCard.tsx        ← single challenge with progress bar
    │   │   ├── ChallengeSection.tsx     ← dashboard section showing 3 active challenges
    │   │   ├── LevelBadge.tsx           ← level pill with star + title (sm/md/lg)
    │   │   └── XpBar.tsx               ← progress bar toward next level
    │   │
    │   └── store-mode/
    │       ├── StoreModeShell.tsx       ← full-screen takeover UI
    │       ├── ChartScanner.tsx         ← scan chart in store
    │       ├── QuickThreadSearch.tsx
    │       ├── QuickFabricSearch.tsx
    │       ├── ShoppingListView.tsx
    │       └── NearbyStores.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts               ← browser Supabase client
    │   │   ├── server.ts               ← server-side Supabase client
    │   │   └── queries.ts              ← all DB query functions
    │   ├── anthropic.ts                ← Anthropic client + helpers
    │   ├── engagement.ts               ← XP, streak, achievements, challenges, levels
    │   ├── image.ts                    ← client-side compress before upload
    │   ├── duplicate-detection.ts      ← fuzzy match logic for chart duplicates
    │   └── utils.ts
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useEngagement.ts            ← streak, XP, achievements, challenges, recordActivity()
    │   ├── useBottomSheetDrag.ts      ← iOS-native swipe-to-dismiss for bottom sheet modals
    │   ├── usePatterns.ts
    │   ├── useThreads.ts
    │   ├── useFabrics.ts
    │   ├── useKitting.ts
    │   ├── useGeolocation.ts
    │   └── useCamera.ts
    │
    ├── store/
    │   └── appStore.ts                 ← Zustand: user, ui state, store mode flag
    │
    └── types/
        └── index.ts                    ← all TypeScript interfaces and types
```

---

## 🎨 DESIGN SYSTEM

### Color Palette (CSS Variables in globals.css)
```css
:root {
  --rose:        #B36050;   /* primary — warm terracotta */
  --rose-mid:    #CA8070;
  --rose-light:  #F0C8BB;
  --rose-pale:   #FDF4F1;
  --sage:        #5F7A63;   /* success / finished */
  --sage-pale:   #EBF2EC;
  --gold:        #AE7C2A;   /* WIP / in progress */
  --gold-pale:   #FBF5E8;
  --brown:       #3A2418;   /* primary text */
  --muted:       #896E66;   /* secondary text */
  --border:      #E4D6C8;
  --bg:          #FAF6F0;   /* warm off-white */
  --card:        #FFFFFF;
  --danger:      #B03020;
}
```

### Typography
- **Display / Headings:** Playfair Display — loaded via next/font/google
- **Body / UI:** Nunito — loaded via next/font/google
- Both defined in layout.tsx and applied as CSS variables

### Component Conventions
- **Touch targets:** 48x48px minimum everywhere — no exceptions
- **Card style:** border-radius 14px, border 1px solid var(--border), subtle warm shadow
- **Bottom sheet modals** on mobile (slide up from bottom)
- **Centered dialog modals** on tablet/desktop
- **Bottom nav:** 5 tabs, fixed, safe-area-inset-bottom aware
- **iPad:** Bottom nav becomes left side nav at >= 768px
- **Buttons:** Full-width on mobile forms. Rounded-full pill style for primary actions.
- **Status badges:** Rose = Not Started, Gold = WIP, Sage = Finished/Done
- **Loading states:** Skeleton screens, not spinners where possible

### PhotoScanner Component (Critical — Used Everywhere)
```
ALWAYS show both options side by side:
  [ 📷 Take Photo ]  [ 🖼️ Choose from Library ]

Camera:  <input type="file" accept="image/*" capture="environment" />
Library: <input type="file" accept="image/*" />  (no capture attribute)

Both inputs hidden, triggered by styled buttons.
After selection:
  1. Show preview image
  2. Compress client-side (max 1200px wide, JPEG 80%)
  3. Show loading state while AI processes
  4. Show result with "Looks right?" confirm before saving
  5. Allow retake/re-upload from the confirm screen

NEVER force camera-only. NEVER force upload-only.
```

---

## 🔑 KEY IMPLEMENTATION NOTES FOR CLAUDE DEV

1. **Auth:** Email + Password via Supabase Auth. Persistent session. "Remember me" ON by default.
   Password reset via email. No email verification gate — let her in immediately.

2. **All AI calls** go through Next.js API routes (`/api/ai/...`).
   Never import or call Anthropic SDK from client-side code.

3. **Image compression** must happen client-side in the browser BEFORE uploading to Supabase
   or sending to Claude API. Use the Canvas API in `src/lib/image.ts`.
   Target: max 1200px wide, JPEG quality 0.80.

4. **PhotoScanner** is a shared component used in: pattern add form, color key scanning,
   stash scanning, store mode chart scanning, profile photo, FO/FFO photos.
   Build it once and reuse everywhere.

5. **Duplicate detection** runs every time a new pattern is added — manually or via AI scan.
   Use Levenshtein distance for fuzzy name matching. Run client-side before submitting to DB.
   Source: `src/lib/duplicate-detection.ts`

6. **Store Mode** is a full-screen takeover (z-index above everything).
   Accessible in max 2 taps from any screen via the bottom nav or the dashboard button.
   Has its own simplified UI optimized for bright store lighting (high contrast, large text).

7. **Kindle Fire compatibility:** Test at 1024x600. No hover states used for functionality.
   All interactive states must work on touch-only. Use font-display: swap on web fonts.

8. **RLS is non-negotiable.** Every Supabase table has Row Level Security enabled.
   Policy: `user_id = auth.uid()` on all user-data tables.

9. **Streaming AI responses** in the advisor chat use Server-Sent Events (SSE).
   The `/api/ai/advisor` route must use `ReadableStream` and proper SSE headers.

10. **The dogs feature** on onboarding is a delight moment.
    Do not make it feel like a boring form. Use animation, emoji picker, fun copy, pill chips.
    It is fully optional and skippable.

11. **Never lose a user's data** — optimistic UI updates with rollback on error.
    Show toast notifications for success and error states.

12. **Warmth is a feature.** Every empty state, every confirmation, every loading message
    should feel personal and crafting-themed — not generic app copy.

13. **Supabase Storage buckets MUST have `public = true` at the bucket level** for `getPublicUrl()`
    to return accessible URLs. RLS policies alone are NOT enough. Run this SQL in Supabase SQL Editor:
    `UPDATE storage.buckets SET public = true WHERE id IN ('pattern-covers','fo-photos','ffo-photos','profile-photos','fabric-photos','thread-photos','kit-photos');`
    This is Section 4 Part A of `supabase-setup.sql`. Safe for a personal app — URLs are
    UUID-namespaced and not guessable. Revisit with signed URLs in Phase 11 if needed.

---

## ✅ PROGRESS LOG

### HANDOFF NOTE
> Session 12 complete. **Phase 12 (Polish + Launch) is mostly done.** Added sonner toast notifications on all CRUD actions across patterns, kits, embroidery, threads, and fabrics. Created 404 "Lost stitch!" page, error boundaries (root + app-level) with "Dropped stitch!" copy and retry. Added `loading="lazy"` to 15 `<img>` tags across 9 detail/list files. Empty states and loading skeletons were already done from earlier phases. **Tutorial overlay bugs fixed:** last step was off-screen because CSS animation transform overrode centering `translate(-50%, -50%)` — switched to flexbox centering wrapper. Combined 4 individual mobile nav steps into 1 "bottom-nav" step so tutorial doesn't feel stuck. Added z-index layering to fix iOS Safari touch events on tooltip buttons. **iOS-native drag-to-dismiss** added to all 3 bottom sheet modals (StreakDetail, SubstitutionHelper, DuplicateWarning) via new `useBottomSheetDrag` hook. **Next session:** Lighthouse audit, final deploy polish, then share with Mom. Phase 14 (app import) and Phase 15b (digests/wrapped/nudges) still deferred.

---

### Phase 0 — Project Foundation — ✅ DONE
- [x] Next.js 14 init (App Router, TypeScript, Tailwind)
- [x] shadcn/ui installed and configured (Nova/Radix preset)
- [x] next-pwa installed
- [x] PWA manifest.json created with correct theme colors
- [x] PWA icons created (placeholder PNGs, all sizes — real icons to be added later)
- [x] Google Fonts: Playfair Display + Nunito in layout.tsx via next/font
- [x] Design system CSS variables in globals.css (rose, sage, gold, brown palette)
- [x] TypeScript types defined in src/types/index.ts (all models)
- [x] .env.local filled with all Supabase + Anthropic keys
- [x] Supabase project created — kendddbcwrfdtqpjoscy.supabase.co
- [x] Supabase browser client (src/lib/supabase/client.ts)
- [x] Supabase server client (src/lib/supabase/server.ts)
- [x] All 7 DB tables created (profiles, patterns, pattern_threads, thread_inventory, fabric_inventory, wip_journal, shopping_list)
- [x] RLS policies on all tables + auto-create profile trigger on signup
- [x] All 7 storage buckets created (pattern-covers, fo-photos, ffo-photos, thread-photos, fabric-photos, profile-photos, kit-photos)
- [x] Complete folder structure scaffolded
- [x] Anthropic client (src/lib/anthropic.ts) — uses @anthropic-ai/sdk, model claude-sonnet-4-5
- [x] Image compression utility (src/lib/image.ts)
- [x] Duplicate detection utility (src/lib/duplicate-detection.ts)
- [x] Auth middleware (src/middleware.ts)
- [x] Root page.tsx redirect logic (authed → /dashboard, unauthed → /welcome)

### Phase 1 — Auth + Onboarding — ✅ DONE
- [x] Welcome/splash screen (src/app/welcome/page.tsx) — animated entry point, added this session
- [x] Auth page with Sign In / Sign Up tabs (src/app/auth/page.tsx)
- [x] SignUpForm — name, email, password with show/hide (src/components/auth/SignUpForm.tsx)
- [x] SignInForm — email, password with show/hide, forgot password link (src/components/auth/SignInForm.tsx)
- [x] ResetPasswordForm — email submit + success confirmation (src/components/auth/ResetPasswordForm.tsx)
- [x] OnboardingWizard with progress bar + step dots (src/components/onboarding/OnboardingWizard.tsx)
- [x] Step 1: display name (src/components/onboarding/Step1Name.tsx)
- [x] Step 2: profile photo — camera + library + skip (src/components/onboarding/Step2Photo.tsx)
- [x] Step 3: pets — emoji picker, animated pill chips, skip (src/components/onboarding/Step3Dogs.tsx)
- [x] Profile saved to Supabase profiles table after each step
- [x] Onboarding complete flag — skips onboarding if already done
- [x] useAuth hook (src/hooks/useAuth.ts)
- [x] Input component fixed with React.forwardRef (required for react-hook-form)
- [x] Session persistence tested on live Vercel deployment ✅
- [x] Sign out button added to dashboard (temporary, for testing) — src/app/dashboard/page.tsx
- [x] Deployed to Vercel — https://stitch-studio-three.vercel.app
- [x] Supabase Site URL + redirect URLs configured for Vercel domain

### Phase 2 — Layout + Navigation — ✅ DONE
- [x] PageWrapper component (src/components/layout/PageWrapper.tsx)
- [x] TopBar component with back button (src/components/layout/TopBar.tsx)
- [x] BottomNav — 5 tabs, fixed, safe-area-inset-bottom aware (src/components/layout/BottomNav.tsx)
- [x] SideNav for iPad >= 768px (src/components/layout/SideNav.tsx)
- [x] Shared nav-items.ts — single source of truth for all 5 nav tabs (src/components/layout/nav-items.ts)
- [x] (app) route group with layout shell (src/app/(app)/layout.tsx)
- [x] All app pages moved into (app) group: dashboard, patterns, threads, store-mode, ai
- [x] Responsive breakpoint switching (bottom nav ↔ side nav at md/768px)
- [x] Dashboard wired into layout shell (src/app/(app)/dashboard/page.tsx)

**✅ HOW TO TEST PHASE 2 — CONFIRMED WORKING WHEN:**
1. **Bottom nav persists on every page** — tap each of the 5 tabs (Home, Patterns, Stash, Shop, AI) and confirm the nav bar stays visible on all of them. No disappearing nav.
2. **Active tab highlights correctly** — the tab for the current page shows in rose/terracotta; all others are muted gray.
3. **Safe area inset (iPhone)** — on iPhone with home bar, the bottom nav sits above the home indicator with visible breathing room. No content hidden behind the nav.
4. **iPad/tablet nav** — on a screen ≥ 768px wide (or Safari responsive mode), the bottom nav should be GONE and a left side nav should appear with the Stitch Studio logo and all 5 tabs.
5. **Back button** — on Patterns, Stash, Shop, AI pages, tap the arrow in the TopBar and confirm it returns to the previous screen.
6. **Content not hidden** — scroll to the bottom of any page and confirm the last content item is not cut off behind the nav bar.

### Phase 3 — Home Dashboard — ✅ DONE
- [x] DailyGreeting overlay (src/components/dashboard/DailyGreeting.tsx)
      — once-per-day full-screen welcome, time-aware greeting, animated dogs (popIn → float/wiggle staggered by index), "Let's stitch!" CTA, tap-anywhere-to-skip
- [x] CSS keyframe animations added to globals.css: float, wiggle, popIn, fadeSlideUp, shimmer/.skeleton
- [x] Greeting header with display name + all dog names (first 5 inline, +N more) + tail wags line
- [x] Stats 2×2 grid: Patterns, In Progress, Finished, Threads — live data from Supabase
- [x] Quick Actions 2×2 grid: Scan New Pattern, Kitting Check, Log Progress, I'm Shopping!
- [x] Recent patterns list (last 3 by updated_at) with thumbnail, name, designer, status badge
- [x] Empty state for recent patterns (no patterns yet copy)
- [x] WIP nudge card: shows if any WIP hasn't been updated in 7+ days (or never)
- [x] Skeleton loading states for all data-dependent sections
- [x] Sign out button retained for testing

**✅ HOW TO TEST PHASE 3 — CONFIRMED WORKING WHEN:**
1. **Daily greeting overlay** — on first visit of the day, a full-screen warm gradient overlay appears with your name and animated dogs. Each dog pops in one-by-one with a springy animation, then bounces (float) or wiggles (wiggle) continuously. "Let's stitch!" button or tap anywhere dismisses it.
2. **Greeting is once-per-day** — dismiss it, refresh or navigate away and back to /dashboard — it should NOT appear again the same day. (localStorage key: `ss_greeted`)
3. **Dogs animate differently** — even-index dogs float up/down, odd-index dogs wiggle/rotate. With 8 dogs you should see a mix of both.
4. **Dashboard greeting header** — shows time-appropriate greeting ("Good morning/afternoon/evening, [Name]!") plus dog names + "send tail wags 🐾"
5. **Stats cards** — show live counts. With no data, all should show 0. Add a pattern and the count updates on next load.
6. **Quick actions** — all 4 tap correctly and navigate to the right pages.
7. **WIP nudge** — if a pattern is marked WIP with no progress update in 7+ days (or no progress date set), the orange nudge card appears.
8. **Recent patterns** — shows last 3 patterns by updated_at. With no patterns, shows the empty state card.
9. **Skeleton loading** — on slower connections, skeleton shimmer cards should appear while data loads before content pops in.
10. **No layout flash** — bottom nav should remain visible throughout.

### Phase 4 — Patterns Module — ✅ DONE
- [x] Patterns list page (search + filter tabs: All/WIP/Kitted/Finished) — src/app/(app)/patterns/page.tsx
- [x] PatternCard component (thumbnail, name, designer, status badge) — src/components/patterns/PatternCard.tsx
- [x] Pattern add form (all fields per spec) — src/components/patterns/PatternForm.tsx
- [x] Pattern edit form — same PatternForm with mode="edit"
- [x] Pattern detail page — src/components/patterns/PatternDetail.tsx
- [x] Magazine conditional fields — shown/hidden based on chart_type watch
- [x] Per-pattern thread list (add/edit/remove threads) — src/components/patterns/ThreadList.tsx
- [x] StatusToggles (Kitted / WIP / Finished) — src/components/patterns/StatusToggles.tsx
- [x] WipTracker (%, stitches, dates, days counter, progress bar) — src/components/patterns/WipTracker.tsx
- [x] WipJournal (timestamped notes) — src/components/patterns/WipJournal.tsx
- [x] FO photo upload (camera + gallery) — in PatternDetail, uses uploadFoPhoto() from queries.ts
- [x] FFO photo upload (camera + gallery) — in PatternDetail, uses uploadFoPhoto(type="ffo")
- [x] Duplicate detection on add (DuplicateWarning modal) — src/components/patterns/DuplicateWarning.tsx
- [x] Delete pattern with confirmation — in PatternDetail, routes back to /patterns after delete
- [x] All DB queries — src/lib/supabase/queries.ts (full CRUD + storage upload helpers)
- [x] Cover photo upload (camera + library, compress, upload to pattern-covers bucket)

**✅ RESOLVED (Session 4) — Supabase Storage Buckets:**
All 7 storage buckets now have public read policies + authenticated upload/update/delete policies applied.
Photos load correctly in `<img>` tags via `getPublicUrl()`. Full SQL is in `supabase-setup.sql`.

### Phase 5 — Kits Module — ✅ DONE
- [x] Kits list page (search + filter tabs: All/Unopened/Started/Finished) — src/app/(app)/kits/page.tsx
- [x] KitCard component (thumbnail, name, brand, type, status badge) — src/components/kits/KitCard.tsx
- [x] Kit add form (all fields per spec) — src/components/kits/KitForm.tsx
- [x] Kit edit form — same KitForm with mode="edit"
- [x] Kit detail page — src/components/kits/KitDetail.tsx
- [x] Kit type pill selector (Cross Stitch / Embroidery) — iOS segmented control style, in KitForm
- [x] Kit contents pill checkboxes (Fabric / Threads / Needle / Pattern / Other) — big tap targets
- [x] KitStatusControl — iOS segmented control (📦 Unopened / 🪡 Started / ✅ Finished) — src/components/kits/KitStatusControl.tsx
- [x] WIP tracking (% slider, stitches, dates) — reuses WipTracker from patterns (same DB table)
- [x] WIP journal — reuses WipJournal from patterns
- [x] Kit photo upload (camera + library, compress, upload to kit-photos bucket)
- [x] FO photo upload when Finished (camera + gallery)
- [x] FFO photo upload when Finished (camera + gallery)
- [x] Finished stats card (start date, completion date, days to complete)
- [x] Delete kit with confirmation
- [x] Skeleton loading on detail + edit pages
- [x] Kit queries added to src/lib/supabase/queries.ts (getKits, getKit, createKit, updateKit, deleteKit, uploadKitPhoto)
- [x] supabase-setup.sql created in project root — complete safe-to-rerun SQL for entire DB + storage

**✅ HOW TO TEST PHASE 5 — CONFIRMED WORKING WHEN:**
1. **List page** — navigate to the Stitch Studio Kits tab (or tap Home → not visible yet, navigate directly to `/kits`). Should show search bar, 4 filter tabs (All/Unopened/Started/Finished), empty state with 🧺 icon.
2. **Add a kit** — tap the + FAB. Form shows: kit photo (camera + library), kit name (required), brand, pill type selector (Cross Stitch / Embroidery — iOS segmented feel), pill content checkboxes (tap Fabric, Threads, Needle, Pattern — each gets a rose ✓ when active), notes, "Add to my collection 🧺" button.
3. **Kit type selector** — tapping Cross Stitch vs Embroidery highlights the active pill with a white background and shadow (iOS-native feel). Tap both and confirm the active state changes.
4. **Contents pills** — tap each pill (Fabric, Threads, Needle, Pattern). Each should highlight rose with a checkmark when active. Tap again to deselect.
5. **Kit photo** — tap "Take Photo" or "Choose from Library". Photo compresses and shows preview with an × to remove it.
6. **Save** — submit the form. Should redirect to the kit detail page showing your new kit.
7. **Detail page** — shows kit photo, name, brand, type. Below: iOS segmented status control (📦 Unopened | 🪡 Started | ✅ Finished) with warm bg pill selector.
8. **Status: Unopened** — tapping Unopened: contextual description "This kit is still sealed…" shows in a muted box below the control.
9. **Status: Started** — tap Started: description changes to gold/warm, start_date auto-set. Progress Tracker section appears below (% slider, stitches input, save button). Progress Journal section also appears.
10. **Progress tracker** — drag the % slider. The progress bar and number update in real time. Tap "Save progress" — should save to DB.
11. **Journal entry** — type a note and tap "Add note". Entry appears with timestamp and % badge.
12. **Status: Finished** — tap Finished: completion_date auto-set, days_to_complete calculated, progress goes to 100%. Green "Finished! 🎉" stats card appears. FO + FFO photo upload blocks appear below.
13. **FO/FFO photos** — tap camera or library in each block. Photo uploads and displays.
14. **Kit details card** — shows brand, type, and content pills (e.g., 🧵 Threads, 🪡 Needle) for what was included.
15. **Edit kit** — tap ✏️ Edit. Form pre-fills all fields. Change something and save — redirects back to detail with updated values.
16. **Delete** — scroll to bottom, tap "Delete this kit" → confirmation expands inline → "Yes, delete it" → routes back to /kits list.
17. **Filter tabs** — with kits in different statuses, confirm each tab filters correctly (Unopened shows only unopened kits, etc.).
18. **Search** — type a kit name or brand and confirm list filters live.

### Phase 6 — Embroidery Module — ✅ DONE
- [x] Embroidery list page (search + filter tabs: All/In Progress/Finished) — src/app/(app)/embroidery/page.tsx
- [x] EmbroideryCard component — src/components/embroidery/EmbroideryCard.tsx
- [x] EmbroideryForm (cover photo, name/designer/company, stitch type chips, thread type + fabric pills, notes) — src/components/embroidery/EmbroideryForm.tsx
- [x] EmbroideryStatusControl — iOS segmented control (🌱 Not Started / 🌸 In Progress / ✅ Finished) using wip/completion_date pattern — src/components/embroidery/EmbroideryStatusControl.tsx
- [x] EmbroideryDetail — full detail view reusing WipTracker, WipJournal, FO/FFO photo upload — src/components/embroidery/EmbroideryDetail.tsx
- [x] New, [id], [id]/edit pages in src/app/(app)/embroidery/
- [x] Embroidery CRUD queries added (getEmbroideries, getEmbroidery, createEmbroidery, updateEmbroidery, deleteEmbroidery) — src/lib/supabase/queries.ts
- [x] Stitch types stored as TEXT[] in stitch_types; thread type → rec_thread_brand; fabric → rec_fabric
- [x] 2-way Patterns/Kits switcher expanded to 3-way: 📖 Patterns | 🌸 Embroidery | 🧺 Kits

**DB field mapping for Embroidery:**
- `stitch_types TEXT[]` — chip-style free-form input (e.g. "satin stitch", "chain stitch")
- `rec_thread_brand` — repurposed for Thread Type (Stranded Cotton / Perle Cotton / Wool / Silk / Mixed)
- `rec_fabric` — repurposed for Fabric (Linen / Cotton / Interfaced / Hoop frame / Other)
- Status uses `wip` + `completion_date` (same as cross stitch patterns, NOT kit_status)

### Session 5 Extras — ✅ DONE (2026-03-14)

**Roku Pre-Signup Intro** — `src/app/intro/page.tsx`
- 4-step guided intro experience for first-time unauthenticated visitors
- Narrator: Roku, an aussie doodle (golden/brown, curly fur) — built as inline SVG avatar with: floppy ears, big expressive eyes, happy tongue, cheek blush, paw prints
- Speech bubble + animated slide-up content per step; Roku avatar bounces with CSS float animation
- Step 1: "Woof! Hi, I'm Roku!" | Step 2: Features overview | Step 3: AI scanning demo | Step 4: Ready to begin?
- Progress dots at top, Skip button always visible, "I already have an account" shown on last step
- On complete/skip: sets localStorage key `ss_roku_intro_seen = 'true'`, routes to /auth
- `/welcome` now checks localStorage on mount → if intro not seen, redirects to `/intro` → prevents flash with blank screen guard

**Dashboard fixes**
- Dogs subline: now shows 2 randomly-selected dogs, day-seeded (stable within a day, rotates daily). With 8 dogs, shows "🐕 Rex & 🐩 Bella send tail wags 🐾" instead of all 8
- Fixed `&apos;` bug in WIP nudge text (was rendering literally as `&apos;` in JS string context)
- Removed "Sign out (testing)" button from dashboard
- Removed stale `useAuth` import

**Navigation**
- Bottom nav "Patterns" tab renamed to **"Projects"** — more natural for a user who does cross stitch, embroidery, AND kits

**Key localStorage keys:**
- `ss_greeted` — daily greeting overlay (value = today's date string)
- `ss_roku_intro_seen` — Roku pre-signup intro (value = 'true')

### Phase 7 — Thread Inventory — ✅ DONE
- [x] Thread list (search + dynamic manufacturer filter tabs) — src/app/(app)/threads/page.tsx
- [x] 🧵 Threads / 🪢 Fabrics switcher at top of stash section
- [x] ThreadCard (manufacturer, color number swatch, color name, quantity badge) — src/components/threads/ThreadCard.tsx
- [x] ThreadForm (manufacturer dropdown, color number + name fields, +/- quantity buttons, thread type pills, notes) — src/components/threads/ThreadForm.tsx
- [x] threads/new page — src/app/(app)/threads/new/page.tsx
- [x] threads/[id] detail page — live quantity +/- on detail, inline edit mode, patterns cross-reference list, delete with confirmation — src/app/(app)/threads/[id]/page.tsx
- [x] Thread inventory CRUD queries + getPatternsUsingThread — src/lib/supabase/queries.ts

**Thread inventory notes:**
- Manufacturer filter tabs are dynamic — only shows tabs for manufacturers that exist in stash
- Cross-reference joins pattern_threads → patterns to show patterns using a specific thread
- `fabric_inventory` table has no `updated_at` column — sort by `created_at` only

### Phase 8 — Fabric Inventory — ✅ DONE
- [x] Fabric list (search + fabric type filter tabs: All/Aida/Linen/Evenweave/Other) — src/app/(app)/fabrics/page.tsx
- [x] 🧵 Threads / 🪢 Fabrics switcher (Fabrics tab active here)
- [x] FabricCard (photo thumbnail, color name, manufacturer + size, type + count badges) — src/components/fabrics/FabricCard.tsx
- [x] FabricForm (photo upload camera+library+compress, manufacturer dropdown, color/size text fields, fabric type pills, count pills 14–36ct, notes) — src/components/fabrics/FabricForm.tsx
- [x] fabrics/new page — src/app/(app)/fabrics/new/page.tsx
- [x] fabrics/[id] detail page — full photo display, inline edit mode, delete with confirmation — src/app/(app)/fabrics/[id]/page.tsx
- [x] Fabric inventory CRUD queries + uploadFabricPhoto (fabric-photos bucket) — src/lib/supabase/queries.ts

### Phase 9 — AI Features — ✅ DONE
- [x] PhotoScanner shared component (camera + upload, preview, compress, "Scan with AI" button) — src/components/ai/PhotoScanner.tsx
- [x] /api/ai/scan-cover route — Claude Vision extracts pattern name, designer, company, sizes, thread brand, fabric, chart type
- [x] /api/ai/scan-colorkey route — Claude Vision extracts full thread list (manufacturer, color #, name, strands, stitch type, skeins)
- [x] /api/ai/scan-stash route — Claude Vision reads thread organizers/labels for bulk inventory import
- [x] /api/ai/scan-fabric route — Claude Vision identifies fabric manufacturer, type (aida/linen/evenweave), count, color, size (added beyond original plan)
- [x] /api/ai/advisor route (streaming SSE) — warm cross stitch advisor persona, ReadableStream with SSE events
- [x] /api/ai/kitting-suggest route — suggests thread substitutes from user's stash with reasoning
- [x] AI scan integrated into PatternForm — "Auto-fill with AI" button appears after cover photo selection (create mode), uses setValue to fill all form fields
- [x] AI scan integrated into pattern ThreadList — "Scan Color Key" camera/library buttons, preview of found threads, "Add all N threads" bulk import
- [x] AI scan integrated into FabricForm — "Auto-fill with AI" button after fabric photo, fills manufacturer dropdown, color, size, type pills, count pills
- [x] Bulk stash import via AI scan — AI tab > Stash Import tab, photograph thread collection → preview → "Add all to my stash" button
- [x] AI Advisor chat page with 3 tabs (Advisor/Scan/Stash Import) — src/app/(app)/ai/page.tsx
- [x] AdvisorChat component — streaming chat UI with advisor avatar, bouncing dot typing indicator, auto-growing textarea, iMessage-style full-viewport fixed layout — src/components/ai/AdvisorChat.tsx
- [x] Quick-question chips in Advisor (6 common questions: fabric count, washing, backstitching, framing, AIDA vs linen, strands)
- [x] Kitting Check flow — src/app/(app)/kitting/page.tsx — select pattern → compare threads/fabric vs inventory → show results with progress bar
- [x] KittingResult component — have/missing thread display, progress bar, "Mark as Kitted" button, "Substitute?" links — src/components/ai/KittingResult.tsx
- [x] SubstitutionHelper component — bottom sheet modal, calls /api/ai/kitting-suggest, shows up to 3 substitutes from stash with reasons + general advice — src/components/ai/SubstitutionHelper.tsx
- [x] Dashboard stats cards now tappable Links (Patterns → /patterns, In Progress → /patterns?filter=wip, Finished → /patterns?filter=finished, Threads → /threads)
- [x] Dashboard "Kitting Check" quick action now links to /kitting
- [x] Patterns page reads ?filter= query param to set initial filter tab (wrapped in Suspense boundary)
- [x] slideUp CSS animation added to globals.css for bottom sheet modals
- [x] Advisor API route includes credit balance error handling (shows clear message instead of generic error)

**Session 7 extras:**
- AI chat uses fixed full-viewport layout (fixed inset-0, flex column) — no nested scroll conflicts
- overscroll-contain on messages area prevents scroll bleed to parent
- Input bar properly positioned above bottom nav with safe area insets
- Error handling in advisor route surfaces credit balance issues clearly to user

### Phase 10 — Store Mode (In-Store Shopping Assistant) — ✅ DONE
- [x] Store Mode full-screen shell — fixed inset-0 z-50 takeover, dark header (#3A2418), 5-tab navigation — src/app/(app)/store-mode/page.tsx
- [x] Prominent "Exit Store Mode" bar — full-width terracotta (#B36050) button at very top with arrow icon, impossible to miss
- [x] Chart scanner in store — camera/library → /api/ai/scan-cover → duplicate check via findDuplicates() → result: ✅ owned (with status badge + view details link), ⚠️ duplicate (fuzzy match % + view existing), 🆕 new (with add to collection link)
- [x] Quick thread check — large 18px centered input, instant filter against thread inventory, shows manufacturer + color number + quantity per match, ❌ "Not in your stash" for no results
- [x] Quick fabric check — filter pills for type (All/Aida/Linen/Evenweave/Other) + count (14ct–36ct), shows matching fabrics with photo thumbnails + type/count/size badges
- [x] Shopping list view — auto-generated from all active (non-finished) patterns' thread lists vs thread inventory, deduped, grouped by manufacturer, sorted by color number
- [x] Nearby stores tab — graceful geolocation permission request with privacy explanation, denied/error states
- [x] Google Maps Places API integration — /api/places/nearby route with multi-query search (craft store, needlework shop, cross stitch store, quilting fabric store), haversine distance calc, deduped by place_id, sorted by distance, top 15 results
- [x] Store results display — name, address, distance (ft/mi), open/closed badge, tap to open in Apple Maps via maps.apple.com URL
- [x] Geolocation graceful deny handling — clear explanation of why location is needed, "Location access denied" state with retry, error state with retry

**Store Mode UX decisions:**
- Full-screen z-50 takeover (no bottom nav visible) — Store Mode is its own focused experience
- "Exit Store Mode" is a full-width terracotta bar at the very top — not a small button in a corner
- Tab bar uses white-on-dark for active state (high contrast for bright store lighting)
- Thread check input is 18px centered for readability in-store
- Shopping list builds dynamically from pattern_threads vs thread_inventory (no separate shopping_list table queries needed)
- Nearby stores uses text search API (not nearby search) for better craft store coverage

### Phase 11 — PWA + Device Polish — ✅ DONE
- [x] Switched from next-pwa v5 to @ducanh2912/next-pwa (App Router compatible fork) — next.config.mjs
- [x] Service worker auto-generated at build time (public/sw.js) with workbox caching
- [x] Offline fallback page — warm "You're offline" screen with retry button — src/app/offline/page.tsx
- [x] iOS "Add to Home Screen" install banner — 3-step visual guide (Share → Add to Home Screen → Add) with Safari share icon SVG, shows once per device (localStorage ss_install_dismissed), only on iOS Safari when not in standalone mode, 2s delay, positioned above bottom nav — src/components/layout/InstallBanner.tsx
- [x] InstallBanner added to app layout shell — src/app/(app)/layout.tsx
- [x] Middleware updated: /offline added to public paths, sw.js + workbox files excluded from auth matcher
- [x] .gitignore updated: next-pwa generated files (sw.js, workbox-*, worker-*, fallback-*, swe-worker-*)
- [x] Safe area insets verified: BottomNav (env(safe-area-inset-bottom)), SideNav (top+bottom), TopBar (env(safe-area-inset-top)), PageWrapper (72px + safe area bottom) — all correct from earlier phases
- [x] iPad two-column layout verified: SideNav at md:768px, PageWrapper md:pl-[220px] — correct from Phase 2
- [x] Touch targets verified: all buttons 44-56px+ (exceeds 48px minimum) — correct from earlier phases
- [x] Font loading: display: "swap" on Playfair Display + Nunito — Kindle Fire compatible
- [x] PWA manifest complete: all icon sizes (72-512px), maskable icons, standalone display, portrait orientation

**Session 9 decisions:**
- Used @ducanh2912/next-pwa instead of original next-pwa (v5 has App Router incompatibility — _document.js errors)
- PWA disabled in development mode (disable: process.env.NODE_ENV === "development")
- staticPageGenerationTimeout increased to 120s for offline page generation
- Lighthouse audit deferred — app is functional, audit can be done as part of Phase 12 polish

### Phase 14 — Cross-Stitch App Import (R-XP, PatternKeeper, Saga)

**Background:** Mom uses R-XP (and others in the cross stitch community use PatternKeeper and Saga).
She wants to bring her existing data INTO Stitch Studio without re-entering everything manually.
None of these apps have public APIs, so true live sync is not feasible. Instead, we build a
**file-based import wizard** that reads exported data from each app.

**What each app can export:**
- **PatternKeeper (iOS):** Exports thread lists as CSV. Columns: Manufacturer, Color #, Color Name,
  Quantity. This maps directly to our `thread_inventory` table.
- **R-XP (Windows):** Can export pattern data and thread lists as CSV or its own `.xpat` format.
  We target CSV export (easiest common format).
- **Saga:** Newer web-based app — check for CSV/JSON export option at build time.

**Implementation approach:**

1. **Import Entry Point:** Settings page → "Import from another app" section
   Three buttons: "Import from PatternKeeper" | "Import from R-XP" | "Import from Saga"

2. **Import Wizard (3 steps):**
   - Step 1: "Export from [App Name]" — show illustrated instructions on how to export from
     that specific app, with screenshots if possible
   - Step 2: Upload the exported file (CSV or supported format)
   - Step 3: Preview table — show what will be imported, let her review/deselect rows,
     then confirm. Show: "X threads will be added to your stash"

3. **Duplicate handling during import:**
   - Check each thread against existing inventory by manufacturer + color number
   - If already exists: show as "Already in stash (skip)" — do not create duplicate
   - If new: mark as "Will add"
   - She can override (add anyway) per item

4. **Pattern import (more complex — Phase 14b):**
   - CSV with pattern name, designer, size, status — maps to `patterns` table
   - This is harder since pattern data is less standardized across apps
   - Consider PatternKeeper-specific CSV column mapping
   - Build thread import first (Phase 14a), pattern import second (Phase 14b)

5. **Export from Stitch Studio too:**
   - Let her export her thread inventory and pattern list as CSV
   - Good for backup and for switching apps in future
   - Helps if she wants to share her stash data with a friend

**Components needed:**
- `src/app/(app)/settings/page.tsx` — settings page (also needed for Phase 13 tutorial restart)
- `src/components/import/ImportWizard.tsx`
- `src/components/import/ImportPreviewTable.tsx`
- `src/components/import/AppInstructions.tsx` — per-app export instructions

**Build this after Phase 12 (Polish). Thread import first, pattern import second.**
**Priority:** PatternKeeper CSV import first — most users, most straightforward format.

---

### Phase 13 — App Tutorial Onboarding (Post-Launch, After All Features Done) — ✅ DONE

**Purpose:** After the full app is built, give Mom a guided tour so she knows how to use every
feature without needing to ask Frank. This is a first-run overlay tutorial — not a re-run of
the account onboarding (name/photo/pets). It activates automatically the first time she lands
on the dashboard after completing account onboarding, and can be re-triggered from Settings.

**Schema change required — add to profiles table:**
```sql
ALTER TABLE profiles ADD COLUMN tutorial_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN tutorial_skipped_at TIMESTAMPTZ;
```

**Implementation Overview:**

1. **TutorialOverlay component** (`src/components/tutorial/TutorialOverlay.tsx`)
   - Full-screen dimmed backdrop with a spotlight cutout on the highlighted element
   - Tooltip/callout card with: step number, title, short description, Next/Skip buttons
   - Smooth animated transitions between steps (slide or fade)
   - Always shows "Skip tour" in the corner — never trap the user
   - Progress dots at the bottom showing total steps

2. **Step targeting via `data-tutorial-id` attributes**
   - Each targetable element gets `data-tutorial-id="some-id"` added to its JSX
   - TutorialOverlay queries the DOM for the element, reads its `getBoundingClientRect()`,
     and positions the spotlight + tooltip accordingly
   - On step change, re-queries DOM (handles layout shift)

3. **Tour steps (in order):**
   - `greeting` — Dashboard greeting card: "This is your home base. Your name, your stats, everything at a glance."
   - `quick-actions` — Quick Actions grid: "Four shortcuts to your most-used features. Scan a pattern, check your stash, log progress, or shop."
   - `recent-patterns` — Recent patterns list: "Your recently touched patterns always appear here."
   - `nav-patterns` — Bottom nav Patterns tab: "Tap here to browse your full pattern collection."
   - `nav-stash` — Bottom nav Stash tab: "Your thread and fabric inventory lives here."
   - `nav-shop` — Bottom nav Shop tab: "Tap this when you're at a craft store — it checks your stash and finds nearby shops."
   - `nav-ai` — Bottom nav AI tab: "Your AI stitching advisor. Ask anything, scan a color key, or get thread substitutions."
   - `wip-reminder` — WIP nudge card (shown only if a WIP exists): "We'll remind you when a project has been waiting. Tap to log your progress."
   - Final step: "You're all set! Happy stitching ✿" — full-width card, no spotlight, with "Let's go!" button

4. **State management:**
   - `useTutorial` hook (`src/hooks/useTutorial.ts`): checks `tutorial_complete` on profile
   - If `false` and not skipped this session: show tutorial after 800ms delay on first dashboard load
   - On "Skip tour" or completing all steps: call Supabase to set `tutorial_complete = true`
   - Zustand: store `isTutorialActive` flag to pause other interactions while tour is running

5. **Re-trigger from Settings:**
   - Settings page will have "Restart app tour" button
   - Resets `tutorial_complete = false` in Supabase and re-launches TutorialOverlay

6. **Kindle Fire / iPad notes:**
   - On iPad (≥ 768px): spotlight/tooltip positioned relative to SideNav items, not BottomNav
   - On Kindle: ensure spotlight rect calculation accounts for scroll position
   - Tooltip always stays within viewport — flip to opposite side if near edge

7. **Copy tone:** Warm, personal, brief. Write as if a friend is showing her around.
   Example: "See those four buttons? Those are your magic shortcuts." NOT "Navigate to the
   Quick Actions panel to access primary features."

**Build this phase LAST — after Phase 12 (all features complete). Do not build this during
feature development as nav and component structure must be stable first.**

---

### Phase 12 — Polish + Launch — IN PROGRESS (Session 12)
- [x] Toast notifications (success, error, info)
- [x] Empty states (all list pages)
- [x] Loading skeletons (all list pages)
- [x] Error boundaries
- [x] 404 page
- [x] Image lazy loading
- [ ] Final Lighthouse audit
- [x] Deploy to Vercel
- [ ] Custom domain (if applicable)
- [ ] Share app URL with Mom

---

### Profile Page — ✅ DONE (Session 10)
- [x] Profile photo display (from onboarding) — large avatar circle at top
- [x] Display name + dog list (emoji · name format)
- [x] Current streak + longest streak (via StreakCard component)
- [x] Level badge + XP progress bar (LevelBadge + XpBar components)
- [x] Achievement shelf — full grid of all 22 badges, earned/locked states, tap for detail modal
- [x] "Restart app tour" button — added in Phase 13 (Session 11)
- [x] Sign out button (permanent home, removed from dashboard)
- [x] Back to Dashboard link

**Route:** `src/app/(app)/profile/page.tsx`

### Phase 15 — Engagement & Delight System (Duolingo-Inspired)

**Background:** Mom has a 400+ day Duolingo streak. What she loves: the streak habit loop,
visible progress, celebration moments, monthly challenges, and community rank. All of this
translates naturally to a stitching companion. The goal is to make the app feel alive and
rewarding — not just a database, but a companion that celebrates her craft with her.

**Design philosophy:**
- Every meaningful action earns a response — adding a pattern, finishing a WIP, hitting a streak
- Celebrations feel personal (her dogs are involved)
- Progress is always visible — she can see herself growing as a stitcher
- Solo experience is complete and satisfying; community features layer on top naturally later
- Copy tone: warm, playful, never corporate. "You're on fire! 🔥" not "Achievement unlocked."

---

#### 15a — Stitching Streak 🔥

The habit loop. One of the most powerful engagement mechanics from Duolingo.

**What counts as a streak day:**
- Logging WIP progress on any pattern
- Marking a pattern as Kitted, WIP started, or Finished
- Adding a new pattern, thread, or fabric to her collection
- Adding a progress journal entry

**Streak rules:**
- One qualifying action per day = streak maintained
- Streak resets at midnight local time if no action that day
- One "streak freeze" available per week — auto-activates on the first missed day (grace period)
  so a single day away doesn't break a long streak (same as Duolingo)
- Longest streak is stored separately — losing current streak doesn't erase the record

**Dashboard display:**
- Flame emoji 🔥 with the streak count — prominent on dashboard below the greeting
- "Day 1 · Today's the day!" → "Day 7 · One week! 🎉" → "Day 30 · A whole month! 🔥"
- Subtle pulse animation on the flame when it increases
- Tap the streak card → opens Streak Detail sheet showing current streak, longest streak,
  this week's activity dots (filled/empty), and next milestone

**Streak milestone celebrations (full-screen):**
- 3 days: "You're building a habit! 🌱"
- 7 days: "One full week! Rex is proud of you 🐾"
- 14 days: "Two weeks strong! 🔥"
- 30 days: "A whole month of stitching! You're incredible ✿"
- 50 days: "Fifty days! You're basically a stitching machine 🧵"
- 100 days: "ONE HUNDRED DAYS! This deserves a party 🎉🎉🎉" (extra confetti)
- 365 days: "A full year! You are a Grand Master Stitcher. 👑"

---

#### 15b — Achievements & Badges 🏅

Visible shelf of earned badges. Locked badges are shown grayed out so she can see what's coming.

**Collection badges:**
- 🪡 "First Stitch" — added your first pattern
- 📚 "Growing Collection" — 10 patterns added
- 📖 "Bookshelf" — 25 patterns added
- 🏛️ "The Library" — 50 patterns added
- 👑 "The Archive" — 100 patterns added

**Finishing badges:**
- ✂️ "Snip Snip" — finished your first WIP
- ✨ "Maker" — 5 finished pieces
- 🎨 "Prolific" — 10 finished pieces
- 🏆 "Master Finisher" — 25 finished pieces

**Stash badges:**
- 🧵 "Color Me Happy" — 25 threads in stash
- 🌈 "Rainbow Stash" — 100 threads in stash
- 🗄️ "The Stash Whisperer" — 250 threads in stash

**Streak badges:**
- 🔥 "Spark" — 3-day streak
- 🔥🔥 "On Fire" — 7-day streak
- 💪 "Dedicated" — 30-day streak
- 🌟 "Unstoppable" — 100-day streak
- 👑 "Legendary" — 365-day streak

**Special badges:**
- 🧺 "Kit Ready" — first pattern marked Kitted
- 📷 "Organized" — 10 patterns with cover photos
- 📓 "Journal Keeper" — 10 WIP journal entries written
- 🛍️ "Smart Shopper" — used Store Mode
- 🤖 "Tech-Savvy Stitcher" — used AI cover scan
- 🐾 "Fur Baby's Biggest Fan" — added 3+ pets in onboarding

**Badge display (Achievement Shelf page):**
- Grid of badge cards — earned ones in full color with earn date, locked ones grayed out
- Tapping a locked badge shows: name + "Earn this by: [action]"
- Tapping earned badge shows: name + earn date + a warm personal note
- Accessible from dashboard stats or profile page

---

#### 15c — Celebrations & Confetti 🎉

These are the dopamine moments. Full-screen overlays with animation, warm copy, personal touches.

**Trigger: Pattern marked Finished**
This is the biggest celebration. Full-screen takeover:
- Confetti burst (rose, sage, gold colors)
- Dog emoji parade across the screen (animated, same as DailyGreeting dogs)
- Large "✿ Finished! ✿" in Playfair Display
- Pattern name + cover photo shown
- Personalized copy: "You did it! [Name], this is beautiful 🎉"
- Dog line: "[Dog name] is SO proud of you! 🐾"
- Stats shown: days worked on it, total journal entries, stitches completed
- Two buttons: "Add FO Photo 📷" | "Back to My Collection"
- Shareable card option (Phase 16): one-tap image with pattern + stats + Stitch Studio branding

**Trigger: Streak milestone hit (see 15a above)**
- Smaller confetti burst, badge animation flies in
- "[X] day streak! [Copy]" with flame animation
- "Keep going! Come back tomorrow to keep your streak alive."

**Trigger: New badge earned**
- Badge "pops" into view from below (spring animation)
- "You earned a new badge! 🏅" with badge name + icon
- Dismisses automatically after 3 seconds or on tap

**Trigger: First pattern added (first-time only)**
- Warm overlay: "Your collection has begun! ✿"
- "Every great archive starts with one. This is yours."
- CTA: "Add cover photo 📷" | "Keep going →"

**Trigger: Monthly challenge completed (see 15d)**
- Challenge-specific celebration with badge

**Animation specs:**
- Confetti: rose (#B36050), sage (#5F7A63), gold (#AE7C2A), cream (#FDF4F1) particles
- All celebrations: `fadeSlideUp` entry, auto-dismiss or tap-anywhere-to-close
- Never block critical navigation — always has visible close button
- Max duration before auto-dismiss: 6 seconds (except "Pattern Finished" which stays until dismissed)

---

#### 15d — Monthly Challenges 🎯

Rotating monthly goals that give her something to work toward. Resets on the 1st of each month.
She sees active challenges on the dashboard below Quick Actions.

**Challenge types (rotate monthly, 2-3 active at once):**
- **"Stitch Sprint"** — Log WIP progress 5 days this month (progress: 0/5 days)
- **"Scan-a-thon"** — Add 3 new patterns to your collection (progress: 0/3)
- **"Finish Line"** — Complete 1 WIP this month (progress: 0/1)
- **"Stash Keeper"** — Add 10 threads to your inventory (progress: 0/10)
- **"Kitting Day"** — Kit 2 patterns (progress: 0/2)
- **"Photo Day"** — Add cover photos to 5 patterns (progress: 0/5)
- **"Journal Habit"** — Write 3 journal entries (progress: 0/3)
- **"The Deep Dive"** — Scan a color key and add all threads to a pattern (progress: 0/1)
- **"Collection Spring Clean"** — Review and update 5 existing patterns (progress: 0/5)

**Challenge card UI (on dashboard):**
- Card with challenge name, emoji, description, progress bar (X/Y filled)
- Deadline shown: "Ends in 12 days"
- When complete: card turns sage green, checkmark, "Completed! ✓" badge
- Tap for details and challenge-specific tips

**Challenge completion reward:**
- Special achievement badge for each completed challenge
- "Monthly Champion" badge if all 3 challenges completed in one month

**Challenge logic:**
- Progress tracked automatically — she doesn't manually mark anything
- End of month: completed challenges archived, new ones generated for next month
- "Current Challenges" section visible on dashboard when at least 1 is active

---

#### 15e — Level & XP System ⭐

Persistent level shown on profile. Gives a sense of growing mastery over time.

**XP earnings:**
| Action | XP |
|--------|-----|
| Add a pattern | 10 XP |
| Add cover photo to a pattern | 5 XP |
| Add threads to a pattern (per color) | 2 XP |
| Mark pattern as Kitted | 15 XP |
| Log WIP progress | 10 XP |
| Write a journal entry | 8 XP |
| Mark pattern as Finished | 50 XP |
| Add FO photo | 10 XP |
| Add FFO photo | 10 XP |
| Add thread to inventory | 1 XP |
| Complete a monthly challenge | 100 XP |
| 7-day streak | 75 XP bonus |
| 30-day streak | 300 XP bonus |

**Level thresholds:**
| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Apprentice Stitcher | 0 |
| 2 | Journeyman Stitcher | 200 |
| 3 | Skilled Stitcher | 600 |
| 4 | Expert Stitcher | 1,500 |
| 5 | Master Stitcher | 3,500 |
| 6 | Grand Master Stitcher | 7,000 |

**Display:**
- Level badge + title shown on profile page
- XP progress bar toward next level
- When leveling up: celebration overlay "You reached [Level]! 🌟" with new title revealed
- Dashboard: small level badge next to her name (optional toggle)

---

#### 15f — Collection Insights & Wrapped 📊

Periodic recaps that make her feel the growth of her collection.

**Weekly Digest (shown Monday morning on dashboard):**
- "Your week in stitches ✿" card — collapsible
- Patterns added this week, progress logged, streaks maintained
- Warm copy: "What a week! You added 2 patterns and logged 4 stitching sessions."

**Monthly Summary (shown on 1st of each month):**
- Full-screen card: "Here's your [Month] in stitches!"
- Stats: patterns added, threads added, WIPs updated, journal entries, streak days
- Most stitched pattern (most WIP updates)
- Badge of the month (biggest achievement earned)

**Yearly "Stitch Wrapped" (January 1st or anniversary):**
- Duolingo Year in Review equivalent
- Full animated slideshow:
  - "You stitched for [X] days this year!"
  - "You finished [X] pieces! 🎉"
  - "Your collection grew to [X] patterns!"
  - "You added [X] threads to your stash!"
  - "Your longest streak was [X] days!"
  - "Your most-stitched pattern: [name]"
  - Final screen: level + title earned + shareable card

---

#### 15g — Personality & Dog Integration 🐾

The dogs aren't just in onboarding — they're the personality of the whole engagement system.

**Dog-powered notifications/nudges:**
- Streak at risk (hasn't logged today, evening): "[Dog name] is waiting by your hoop! 🐾 Log some progress to keep your streak alive."
- WIP neglected 7+ days: "[Dog name] thinks you should check on [pattern name]! It misses you."
- Streak milestone: "[Dog name] did a happy dance when they heard! 🐾"
- New badge earned: "[Dog name] is barking with excitement! You just earned [Badge]! 🏅"

**Dog parade on celebrations:**
- On Pattern Finished screen: all her dogs animate across the bottom of the screen
- Same popIn → float/wiggle animation as DailyGreeting
- Staggered entry, each dog appears with her name, then floats

---

#### 15h — Community Features (Phase 16, when she invites her stitch group)

These are separate from solo engagement — build Phase 15 first, add community later.

**Core community features:**
- Follow friends by username or invite link
- **Friends' Feed** — a scrollable feed of friends' finished pieces with photos
- **Cheer** — tap a heart/clap/flame reaction on a friend's finished piece (no text comments needed)
- **Group Challenges** — a shared monthly challenge with friend group (e.g., "Who finishes first?")
- **Leaderboard** — weekly XP ranking within her friend group (resets weekly, like Duolingo leagues)
- **Community Challenges** — app-wide challenge everyone participates in (e.g., "Stitch Studio Holiday Sprint")

**Social design philosophy:**
- No public posts, no strangers — friends only (she chooses who to follow)
- No comments section (to avoid negativity) — only reactions (cheer, love, fire)
- Sharing is always optional — she controls what appears in her feed
- Community leaderboard is friends-only, not global — keeps it cozy, not competitive

**Schema additions for Phase 16:**
```sql
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE finished_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  photo_url TEXT,
  caption TEXT,
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cheers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES finished_shares(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT DEFAULT 'cheer', -- 'cheer' | 'love' | 'fire'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(share_id, user_id)
);
```

---

**Schema additions for Phase 15 (add to profiles + new tables):**
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_activity_date DATE;
ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN streak_freeze_used_this_week BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN freeze_week_start DATE;

-- Achievements earned
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Monthly challenge progress
CREATE TABLE challenge_progress (
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
```

**Components needed for Phase 15:**
```
src/components/engagement/
  StreakCard.tsx              ← dashboard streak display (flame, count, tap for detail)
  StreakDetail.tsx            ← bottom sheet: current/longest, week dots, milestones
  CelebrationOverlay.tsx     ← SHARED full-screen celebration: confetti, dogs, copy, CTA
  AchievementBadge.tsx       ← single badge component (earned/locked states)
  AchievementShelf.tsx       ← full grid of all badges
  ChallengeCard.tsx          ← single challenge with progress bar
  ChallengeSection.tsx       ← dashboard section showing active challenges
  LevelBadge.tsx             ← level + title display
  XpBar.tsx                  ← progress bar toward next level
  WeeklyDigest.tsx           ← Monday "your week in stitches" card
  MonthlyWrap.tsx            ← month summary card
  YearlyWrap.tsx             ← Stitch Wrapped annual slideshow
  DogParade.tsx              ← animated dogs across bottom (reused from DailyGreeting)

src/lib/engagement.ts        ← XP calculation, streak logic, achievement checking, challenge tracking
src/hooks/useEngagement.ts   ← loads streak, achievements, challenges for current user
```

**Build order within Phase 15:**
1. Schema migration (ALTER + new tables)
2. `src/lib/engagement.ts` — all logic (XP, streak check, achievement unlock, challenge progress)
3. `useEngagement.ts` hook
4. `CelebrationOverlay.tsx` — used everywhere, build first
5. `StreakCard.tsx` + `StreakDetail.tsx` — visible on dashboard immediately
6. `AchievementBadge.tsx` + `AchievementShelf.tsx`
7. `ChallengeCard.tsx` + `ChallengeSection.tsx`
8. Wire celebrations into pattern actions (Finished, milestone streaks, badges)
9. `LevelBadge.tsx` + `XpBar.tsx` on profile
10. Weekly/Monthly digest cards
11. Yearly Wrapped (can be deferred to Phase 15b)

**Build Phase 15 AFTER Phase 12 (core app complete). Community (Phase 16) after Phase 15.**

---

### Phase 15 — Engagement & Delight System — ✅ DONE (Session 10)

**Schema migration:** `supabase-phase15-migration.sql` (ran successfully)
- [x] 9 columns added to profiles (current_streak, longest_streak, last_activity_date, total_xp, level, streak_freeze_used_this_week, freeze_week_start, tutorial_complete, tutorial_skipped_at)
- [x] achievements table (user_id, achievement_id, earned_at, UNIQUE constraint) + RLS
- [x] challenge_progress table (user_id, challenge_id, month, progress, goal, completed) + RLS
- [x] Performance indexes on achievements(user_id) and challenge_progress(user_id, month)

**Core logic:** `src/lib/engagement.ts`
- [x] XP values for 12 action types (add_pattern=10, mark_finished=50, log_wip_progress=10, write_journal=8, etc.)
- [x] 6-level system: Apprentice (0 XP) → Journeyman (200) → Skilled (600) → Expert (1500) → Master (3500) → Grand Master (7000)
- [x] Streak calculation with weekly freeze grace period (auto-activates once per week on missed day)
- [x] 7 streak milestones (3, 7, 14, 30, 50, 100, 365 days) with celebration messages
- [x] 22 achievements across 5 categories (collection, finishing, stash, streak, special)
- [x] 9 rotating monthly challenges (3 per month, deterministic by month string hash)
- [x] Celebration data builders (finish, badge, level-up, first-pattern, streak-milestone)

**Hook:** `src/hooks/useEngagement.ts`
- [x] `recordActivity()` — updates streak, XP, level, checks achievements, increments challenge progress
- [x] Auto-initializes monthly challenges on first load
- [x] Queues celebrations to Zustand store

**Zustand store updates:** `src/store/appStore.ts`
- [x] celebrationQueue: CelebrationData[] with push/pushMany/pop/clear actions

**12 new components:** `src/components/engagement/`
- [x] CelebrationOverlay — full-screen z-200, confetti particles (rose/sage/gold), dog parade, auto-dismiss for non-finish (4s)
- [x] StreakCard — 🔥 flame with pulse animation, streak count, message, tap to open detail
- [x] StreakDetail — bottom sheet with current/longest, week activity dots (M-S), next milestone
- [x] AchievementBadge — earned (full color + date) / locked (grayed + grayscale) states
- [x] AchievementShelf — grid by category, tap for detail modal (earned date or earn instructions)
- [x] ChallengeCard — progress bar, days remaining, completed state (sage green)
- [x] ChallengeSection — dashboard section showing 3 active challenges
- [x] LevelBadge — colored pill with star + title, 3 sizes (sm/md/lg)
- [x] XpBar — progress bar to next level with XP counts

**Profile page:** `src/app/(app)/profile/page.tsx`
- [x] Avatar, display name, dogs, level badge (lg), XP bar, streak card, full achievement shelf, sign out

**Dashboard integration:** `src/app/(app)/dashboard/page.tsx`
- [x] Profile avatar link (top-right of greeting header)
- [x] Level badge below greeting
- [x] Streak card below stats row
- [x] Monthly challenges section below Quick Actions
- [x] Challenge data loaded alongside existing dashboard queries

**Wired into actions:**
- [x] StatusToggles — kitted → `recordActivity("mark_kitted")`; finished → celebration overlay + `recordActivity("mark_finished")`
- [x] WipTracker — save progress → `recordActivity("log_wip_progress")`
- [x] WipJournal — add note → `recordActivity("write_journal")`

**App layout:** CelebrationOverlay mounted globally in `src/app/(app)/layout.tsx`

**CSS animations added:** confettiFall, pulse, badgePop, flamePulse, streakGlow

**Not yet built (Phase 15b — deferred):**
- [ ] WeeklyDigest.tsx — Monday "your week in stitches" card
- [ ] MonthlyWrap.tsx — month summary card
- [ ] YearlyWrap.tsx — Stitch Wrapped annual slideshow
- [ ] Dog-powered notification nudges (15g) — streak-at-risk, WIP neglected messaging

---

### Phase 13 — App Tutorial Onboarding — ✅ DONE (Session 11)
- [x] TutorialOverlay component — spotlight cutout (CSS mask), positioned tooltip with Roku SVG avatar, progress dots, Next/Skip buttons — src/components/tutorial/TutorialOverlay.tsx
- [x] useTutorial hook — 8-step definitions, start/skip/complete/restart, Supabase persistence — src/hooks/useTutorial.ts
- [x] Zustand tutorial state — isTutorialActive, tutorialStep, setters — src/store/appStore.ts
- [x] Dashboard data-tutorial-id attributes — greeting, quick-actions, recent-patterns sections
- [x] Nav items already had data-tutorial-id (nav-home, nav-patterns, nav-stash, nav-shop, nav-ai) from Phase 2
- [x] Auto-trigger on first dashboard load when tutorial_complete === false (800ms delay)
- [x] Skip or complete → sets tutorial_complete = true in Supabase profiles
- [x] TutorialOverlay mounted globally in app layout (z-300, above celebrations at z-200)
- [x] "Restart App Tour" button on Profile page — resets tutorial_complete, navigates to dashboard, re-launches after 800ms
- [x] CSS animations: tutorialTooltipPop, tutorialRokuBounce — src/app/globals.css
- [x] No schema changes needed — tutorial_complete + tutorial_skipped_at already existed from Phase 15 migration

**Tutorial steps — mobile (5 steps):**
1. `greeting` — "Your home base" — dashboard heading
2. `quick-actions` — "Your magic shortcuts" — 2x2 grid
3. `recent-patterns` — "Recently touched" — last 3 patterns
4. `bottom-nav` — "Your navigation" — entire bottom nav bar highlighted
5. Final — "You're all set! Happy stitching! ✿" — flexbox-centered card, no spotlight

**Tutorial steps — desktop/tablet (8 steps):**
Steps 1-3 same as mobile, then individual side nav items (nav-patterns, nav-stash, nav-shop, nav-ai), then final.

---

### Session 11 Bug Fixes — ✅ DONE (2026-03-14)

**Tutorial overlay broken on iOS Safari:**
- [x] CSS `mask-composite: exclude` / `-webkit-mask-composite: xor` does NOT work on iOS Safari — backdrop was fully opaque, blocking everything
- [x] Rewrote TutorialOverlay to use SVG `<mask>` element for spotlight cutout — works on all browsers
- [x] Removed `touchAction: "none"` from overlay container — was blocking ALL touch events on mobile
- [x] Switched to `pointerEvents: "none"` on container, `pointerEvents: "auto"` on SVG backdrop and tooltip
- [x] Added smart `scrollIntoView` skip for fixed elements (bottom nav) — prevents weird page scroll
- [x] Tooltip positioning now auto-detects space above/below and picks the best side
- [x] Increased button touch targets (h-10, px-6) for easier mobile tapping

**Engagement not firing on creation:**
- [x] PatternForm — `recordActivity("add_pattern")` on create — src/components/patterns/PatternForm.tsx
- [x] KitForm — `recordActivity("add_pattern")` on create — src/components/kits/KitForm.tsx
- [x] EmbroideryForm — `recordActivity("add_pattern")` on create — src/components/embroidery/EmbroideryForm.tsx
- [x] threads/new — `recordActivity("add_thread_inventory")` on create — src/app/(app)/threads/new/page.tsx
- [x] All four now import `useEngagement` hook and call `recordActivity` before `router.push()`

**Dashboard greeting cut off on iPhone:**
- [x] PageWrapper `pt-4` replaced with `style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}`
- [x] Greeting header now clears iPhone notch/dynamic island on all devices

---

### Phase 12 — Polish + Launch — IN PROGRESS (Session 12)
- [x] Toast notifications — sonner library, Toaster in root layout, toasts on all CRUD actions across patterns, kits, embroidery, threads, fabrics, WIP progress, journal notes, status toggles, photo uploads
- [x] Empty states (all list pages) — already done in earlier phases
- [x] Loading skeletons (all list pages) — already done in earlier phases
- [x] Error boundaries — root `src/app/error.tsx` + app-level `src/app/(app)/error.tsx`, warm "Dropped stitch!" copy with retry
- [x] 404 page — `src/app/not-found.tsx`, warm "Lost stitch!" copy with Back to Home link
- [x] Image lazy loading — `loading="lazy"` on 15+ `<img>` tags across detail pages, dashboard, store mode; form previews left eager
- [x] Deploy to Vercel — auto-deploys from main, live at stitch-studio-three.vercel.app
- [ ] Final Lighthouse audit
- [ ] Custom domain (if applicable)
- [ ] Share app URL with Mom

---

### Session 12 Bug Fixes + Polish — ✅ DONE (2026-03-14)

**Tutorial overlay broken on mobile (3 bugs):**
- [x] Last step ("You're all set!") off-screen — CSS animation `tutorialTooltipPop` transform overrode centering `translate(-50%, -50%)`. Switched to flexbox centering wrapper (`fixed inset-0 flex items-center justify-center`)
- [x] Nav steps stuck/confusing on mobile — combined 4 individual nav tab steps into 1 `bottom-nav` step. Added `data-tutorial-id="bottom-nav"` to BottomNav `<nav>` element. Desktop/tablet keeps individual side nav steps.
- [x] Tooltip buttons not responding on iOS Safari — added explicit `z-index: 10` to tooltip (vs z:1 on SVG backdrop)
- [x] Tutorial now has responsive step sets: `MOBILE_STEPS` (5 steps) vs `DESKTOP_STEPS` (8 steps), chosen by viewport width

**iOS-native drag-to-dismiss on all bottom sheet modals:**
- [x] Created `useBottomSheetDrag` hook — `src/hooks/useBottomSheetDrag.ts`
  - Touch drag from handle area (top 48px), 100px threshold to dismiss
  - Smooth translateY tracking during drag, proportional backdrop fade
  - Snap-back animation if released below threshold
  - Slide-out + fade animation on dismiss
- [x] Wired into StreakDetail — `src/components/engagement/StreakDetail.tsx`
- [x] Wired into SubstitutionHelper — `src/components/ai/SubstitutionHelper.tsx` (also added drag handle bar)
- [x] Wired into DuplicateWarning — `src/components/patterns/DuplicateWarning.tsx` (also added drag handle bar, mobile only via `sm:hidden`)
- [x] All bottom sheets now dismiss via: tap backdrop, drag down from handle, or press close/cancel buttons

---

*End of CLAUDE.md — keep this file updated every session.*
