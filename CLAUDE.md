# CLAUDE.md — Stitch Studio
# Cross Stitch Companion App for Mom
# Last Updated: [UPDATE THIS EVERY END-OF-CHAT SESSION]

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
> PROJECT NOT STARTED. First session task: initialize the Next.js 14 project with TypeScript
> and Tailwind, install shadcn/ui, configure next-pwa, load Google Fonts in layout.tsx, set up
> the design system CSS variables in globals.css, create the TypeScript types file, configure
> Supabase client (browser + server), scaffold the complete folder structure, and set up
> .env.local with all required variable names (empty values). Do NOT start building features
> until the entire foundation is confirmed working. Commit after foundation is complete.

---

### Phase 0 — Project Foundation
- [ ] Next.js 14 init (App Router, TypeScript, Tailwind)
- [ ] shadcn/ui installed and configured
- [ ] next-pwa installed and configured
- [ ] PWA manifest.json created with correct theme colors
- [ ] PWA icons generated (all sizes)
- [ ] Google Fonts: Playfair Display + Nunito in layout.tsx via next/font
- [ ] Design system CSS variables in globals.css
- [ ] TypeScript types defined in src/types/index.ts
- [ ] .env.local template created with all variable names
- [ ] Supabase project created (external — done by Frank)
- [ ] Supabase browser client configured (src/lib/supabase/client.ts)
- [ ] Supabase server client configured (src/lib/supabase/server.ts)
- [ ] All DB tables created in Supabase with correct schema
- [ ] RLS policies created for all tables
- [ ] All storage buckets created in Supabase
- [ ] Complete folder structure scaffolded
- [ ] Anthropic client configured (src/lib/anthropic.ts)
- [ ] Image compression utility (src/lib/image.ts)
- [ ] Duplicate detection utility (src/lib/duplicate-detection.ts)
- [ ] Auth middleware (middleware.ts — redirect unauthenticated users)
- [ ] Root page.tsx redirect logic (authed → /dashboard, unauthed → /auth)

### Phase 1 — Auth + Onboarding
- [ ] Auth page with Sign In / Sign Up tabs
- [ ] SignUpForm (name, email, password with show/hide)
- [ ] SignInForm (email, password with show/hide, forgot password link)
- [ ] ResetPasswordForm
- [ ] Onboarding wizard (3 steps)
- [ ] Step 1: display name
- [ ] Step 2: profile photo (camera + upload, skippable)
- [ ] Step 3: dogs (emoji picker, pill chips, skippable, animated)
- [ ] Profile saved to Supabase profiles table
- [ ] Onboarding complete flag — skip onboarding if already done
- [ ] Session persistence tested on iPhone Safari + Kindle

### Phase 2 — Layout + Navigation
- [ ] Root layout with safe area insets
- [ ] PageWrapper component
- [ ] TopBar component (with back button for detail pages)
- [ ] BottomNav (5 tabs, fixed, safe-area aware)
- [ ] SideNav for iPad (>= 768px)
- [ ] Responsive breakpoint switching (bottom nav ↔ side nav)

### Phase 3 — Home Dashboard
- [ ] Greeting with display name + dogs
- [ ] Stats cards (patterns total, WIPs, finished, thread count)
- [ ] Quick Actions grid (4 actions)
- [ ] Recent patterns list (last 3 with thumbnails)
- [ ] WIP reminder nudge card
- [ ] "I'm Shopping!" button prominent and accessible

### Phase 4 — Patterns Module
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
