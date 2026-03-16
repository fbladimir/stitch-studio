// ============================================================
// Stitch Studio — TypeScript Types
// ============================================================

// ── User / Profile ──────────────────────────────────────────

export interface Dog {
  id: string;
  name: string;
  emoji: string;
}

export interface Profile {
  id: string;
  name: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  dogs: Dog[];
  onboarding_complete: boolean;
  // Engagement (Phase 15)
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_xp: number;
  level: number;
  streak_freeze_used_this_week: boolean;
  freeze_week_start: string | null;
  tutorial_complete: boolean;
  tutorial_skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Engagement (Phase 15) ─────────────────────────────────────

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  month: string;
  progress: number;
  goal: number;
  completed: boolean;
  completed_at: string | null;
}

export type CelebrationType =
  | "pattern_finished"
  | "streak_milestone"
  | "badge_earned"
  | "first_pattern"
  | "challenge_complete"
  | "level_up";

export interface CelebrationData {
  type: CelebrationType;
  title: string;
  subtitle: string;
  dogLine?: string;
  patternName?: string;
  coverPhotoUrl?: string;
  badgeIcon?: string;
  badgeName?: string;
  streakCount?: number;
  levelTitle?: string;
  stats?: { label: string; value: string }[];
}

// ── Patterns ─────────────────────────────────────────────────

export type PatternType = "cross_stitch" | "embroidery" | "kit_cross_stitch" | "kit_embroidery";
export type ChartType = "paper" | "pdf" | "magazine" | "digital";
export type KitStatus = "unopened" | "started" | "finished";

export interface KitContents {
  fabric: boolean;
  threads: boolean;
  needle: boolean;
  pattern: boolean;
  other: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  type: PatternType;
  name: string;
  designer: string | null;
  company: string | null;
  size_inches: string | null;
  size_stitches: string | null;
  rec_thread_brand: string | null;
  rec_fabric: string | null;
  chart_type: ChartType | null;
  magazine_name: string | null;
  magazine_issue: string | null;
  magazine_month_year: string | null;
  cover_photo_url: string | null;
  notes: string | null;
  // Status
  kitted: boolean;
  kitted_date: string | null;
  wip: boolean;
  wip_pct: number;
  wip_stitches: number;
  start_date: string | null;
  last_progress_date: string | null;
  completion_date: string | null;
  days_to_complete: number | null;
  fo_photo_url: string | null;
  ffo_photo_url: string | null;
  // Kit-specific
  kit_contents: KitContents | null;
  kit_status: KitStatus | null;
  // Embroidery-specific
  stitch_types: string[] | null;
  // Stitching mode (Phase 17)
  daily_stitch_target: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ── Pattern Threads ──────────────────────────────────────────

export type StitchType = "full" | "backstitch" | "french_knot" | "other";

export interface PatternThread {
  id: string;
  pattern_id: string;
  manufacturer: string | null;
  color_number: string | null;
  color_name: string | null;
  strands: string | null;
  stitch_type: StitchType | null;
  skeins_needed: number;
  sort_order: number;
}

// ── Thread Inventory ─────────────────────────────────────────

export type ThreadType = "cotton" | "silk" | "rayon" | "wool" | "perle" | "blended" | "other";

export interface ThreadInventoryItem {
  id: string;
  user_id: string;
  manufacturer: string;
  color_number: string | null;
  color_name: string | null;
  quantity: number;
  thread_type: ThreadType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Fabric Inventory ─────────────────────────────────────────

export type FabricType = "aida" | "linen" | "evenweave" | "other";
export type FabricCount = "14" | "16" | "18" | "20" | "22" | "25" | "28" | "32" | "36";

export interface FabricInventoryItem {
  id: string;
  user_id: string;
  manufacturer: string | null;
  color_name: string | null;
  size: string | null;
  count: FabricCount | null;
  fabric_type: FabricType | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

// ── WIP Journal ──────────────────────────────────────────────

export interface WipJournalEntry {
  id: string;
  pattern_id: string;
  user_id: string;
  note: string | null;
  pct_at_time: number | null;
  stitches_at_time: number | null;
  created_at: string;
}

// ── Shopping List ────────────────────────────────────────────

export type ShoppingItemType = "thread" | "fabric";

export interface ShoppingListItem {
  id: string;
  user_id: string;
  pattern_id: string | null;
  item_type: ShoppingItemType;
  manufacturer: string | null;
  color_number: string | null;
  color_name: string | null;
  quantity_needed: number;
  quantity_have: number;
  acquired: boolean;
  created_at: string;
}

// ── AI Scan Results ──────────────────────────────────────────

export interface AIScanCoverResult {
  name?: string;
  designer?: string;
  company?: string;
  size_inches?: string;
  size_stitches?: string;
  rec_thread_brand?: string;
  rec_fabric?: string;
  chart_type?: ChartType;
  confidence: number;
}

export interface AIScanThreadResult {
  manufacturer: string;
  color_number: string;
  color_name: string;
  strands?: string;
  stitch_type?: StitchType;
  skeins_needed?: number;
}

// ── Kitting ──────────────────────────────────────────────────

export interface KittingResult {
  pattern: Pattern;
  threads_needed: PatternThread[];
  threads_have: PatternThread[];
  threads_missing: PatternThread[];
  fabric_needed: string | null;
  fabric_have: FabricInventoryItem | null;
  is_ready: boolean;
}

// ── Stitch Sessions (Phase 17) ───────────────────────────────

export interface StitchSession {
  id: string;
  pattern_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  stitches_completed: number;
  notes: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  pattern_id: string;
  user_id: string;
  session_id: string | null;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

// ── Thread Manufacturers ─────────────────────────────────────

export const THREAD_MANUFACTURERS = [
  "DMC",
  "Anchor",
  "Weeks Dye Works",
  "Gentle Arts",
  "Classic Colorworks",
  "Simply Shaker",
  "Cosmos",
  "Sulky",
  "Other",
] as const;

export type ThreadManufacturer = (typeof THREAD_MANUFACTURERS)[number];

// ── Fabric Manufacturers ─────────────────────────────────────

export const FABRIC_MANUFACTURERS = [
  "Zweigart",
  "Charles Craft",
  "Wichelt",
  "Fabric Flair",
  "DMC",
  "Other",
] as const;

export type FabricManufacturer = (typeof FABRIC_MANUFACTURERS)[number];
