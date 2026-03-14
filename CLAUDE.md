# CLAUDE.md — Stitch Studio
# Cross Stitch Companion App for Mom
# Last Updated: 2026-03-13 (Session 2)

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

**Row Level Security — enable on ALL tables:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

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
    │   ├── store-mode/
    │   │   └── page.tsx               ← in-store shopping assistant
    │   │
    │   ├── ai/
    │   │   └── page.tsx               ← AI advisor chat + scan tools
    │   │
    │   └── api/
    │       ├── ai/
    │       │   ├── scan-cover/route.ts
    │       │   ├── scan-colorkey/route.ts
    │       │   ├── scan-stash/route.ts
    │       │   ├── advisor/route.ts      ← streaming SSE
    │       │   └── kitting-suggest/route.ts
    │       └── places/
    │           └── nearby/route.ts       ← Google Maps Places proxy
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
    │   ├── image.ts                    ← client-side compress before upload
    │   ├── duplicate-detection.ts      ← fuzzy match logic for chart duplicates
    │   └── utils.ts
    │
    ├── hooks/
    │   ├── useAuth.ts
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

---

## ✅ PROGRESS LOG

### HANDOFF NOTE
> Session 2 complete. Phases 2 + 3 fully done and deployed to Vercel (https://stitch-studio-three.vercel.app). Phase 2: layout shell — BottomNav, SideNav, TopBar, PageWrapper, (app) route group with all authenticated pages inside it (nav bug fixed). Phase 3: full dashboard — DailyGreeting once-per-day overlay with animated dogs (8 dogs, staggered popIn → float/wiggle), time-aware greeting messages, stats grid, quick actions, recent patterns, WIP nudge, skeleton loading. New additions this session: Mom's feedback incorporated — (1) AI cover page scan already spec'd in Phase 9 and confirmed critical; (2) "visual database" confirmed as the app's core purpose — the Patterns/Threads/Fabrics pages ARE her visual collection; (3) Cross-stitch app import added as Phase 14 (R-XP, PatternKeeper, Saga — file-based CSV import wizard, thread import first, pattern import second); (4) Core Value Proposition section added to CLAUDE.md design principles. Daily greeting localStorage key: "ss_greeted". Next session starts Phase 4: Patterns Module. Phase 2 (Layout + Navigation) is fully DONE. Route group `(app)` created at `src/app/(app)/` — all authenticated pages live here and automatically get the nav shell. Old `src/app/dashboard/` removed; dashboard now at `src/app/(app)/dashboard/page.tsx`. Nav components: BottomNav (5 tabs, fixed, safe-area-inset-bottom), SideNav (tablet ≥ 768px, left rail 220px wide), TopBar (sticky, back button, right slot), PageWrapper (handles bottom/side nav padding + safe area). Nav items defined in `src/components/layout/nav-items.ts` and shared by both nav components — adding/changing tabs only requires editing that one file. All 5 tabs: Home → /dashboard, Patterns → /patterns, Stash → /threads, Shop → /store-mode, AI → /ai. Build passes clean. Tutorial onboarding spec added to CLAUDE.md as Phase 13 (post-launch). Next session starts Phase 3: Home Dashboard — greeting, stats row, quick actions grid, recent patterns, WIP nudge card.

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

### Phase 4 — Patterns Module — 🔜 NEXT
- [ ] Patterns list page (search + filter tabs: All/WIP/Kitted/Finished)
- [ ] PatternCard component (thumbnail, name, designer, status badge)
- [ ] Pattern add form (all fields per spec)
- [ ] Pattern edit form
- [ ] Pattern detail page
- [ ] Magazine conditional fields
- [ ] Per-pattern thread list (add/edit/remove threads)
- [ ] StatusToggles (Kitted / WIP / Finished)
- [ ] WipTracker (%, stitches, dates, days counter, progress bar)
- [ ] WipJournal (timestamped notes)
- [ ] FO photo upload (camera + gallery)
- [ ] FFO photo upload (camera + gallery)
- [ ] Duplicate detection on add (DuplicateWarning modal)
- [ ] Delete pattern with confirmation

### Phase 5 — Kits Module
- [ ] Kits list page
- [ ] Kit add/edit form
- [ ] Kit status tracking (Unopened/Started/Finished)
- [ ] WIP tracking for kits (same as patterns)
- [ ] Kit photo upload

### Phase 6 — Embroidery Module
- [ ] Embroidery list page
- [ ] Embroidery add/edit form
- [ ] Status tracking

### Phase 7 — Thread Inventory
- [ ] Thread list (search + filter by manufacturer)
- [ ] ThreadCard (manufacturer, number, color name, quantity)
- [ ] ThreadForm (add/edit)
- [ ] Quantity +/- buttons
- [ ] Thread → patterns cross-reference view
- [ ] Delete thread with confirmation

### Phase 8 — Fabric Inventory
- [ ] Fabric list (filter by count, type)
- [ ] FabricCard
- [ ] FabricForm (add/edit)
- [ ] Fabric photo upload (camera + gallery)
- [ ] Delete fabric with confirmation

### Phase 9 — AI Features
- [ ] PhotoScanner shared component (camera + upload, preview, compress, confirm)
- [ ] /api/ai/scan-cover route
- [ ] /api/ai/scan-colorkey route
- [ ] /api/ai/scan-stash route
- [ ] /api/ai/advisor route (streaming SSE)
- [ ] /api/ai/kitting-suggest route
- [ ] AI scan integrated into PatternForm (cover page)
- [ ] AI scan integrated into pattern thread list (color key)
- [ ] Bulk stash import via AI scan
- [ ] AI Advisor chat page (AdvisorChat component, streaming)
- [ ] Kitting Check flow (select pattern → compare → shopping list)
- [ ] KittingResult component
- [ ] SubstitutionHelper component
- [ ] Quick-question chips in Advisor

### Phase 10 — Store Mode (In-Store Shopping Assistant)
- [ ] Store Mode full-screen shell
- [ ] Chart scanner in store (camera → AI → duplicate check → result)
- [ ] Quick thread check (type number → instant inventory result)
- [ ] Quick fabric check
- [ ] Shopping list view (consolidated from all kitting checks)
- [ ] Nearby stores tab (geolocation permission request)
- [ ] Google Maps Places API integration (/api/places/nearby route)
- [ ] Store results display (name, distance, hours, tap to open maps)
- [ ] Geolocation graceful deny handling

### Phase 11 — PWA + Device Polish
- [ ] iOS "Add to Home Screen" install banner/instructions
- [ ] Service worker caching strategy (next-pwa)
- [ ] Offline read mode (cached data)
- [ ] Kindle Fire testing and fixes
- [ ] Safe area insets verified on all iPhones
- [ ] iPad two-column layout verified
- [ ] Performance audit (Lighthouse)

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

### Phase 13 — App Tutorial Onboarding (Post-Launch, After All Features Done)

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

### Phase 12 — Polish + Launch
- [ ] Toast notifications (success, error, info)
- [ ] Empty states (all list pages)
- [ ] Loading skeletons (all list pages)
- [ ] Error boundaries
- [ ] 404 page
- [ ] Image lazy loading
- [ ] Final Lighthouse audit
- [ ] Deploy to Vercel
- [ ] Custom domain (if applicable)
- [ ] Share app URL with Mom

---

*End of CLAUDE.md — keep this file updated every session.*
