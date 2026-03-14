// ============================================================
// Stitch Studio — Engagement System (Phase 15)
// XP, Streaks, Achievements, Challenges, Levels
// ============================================================

import type { CelebrationData, Profile } from "@/types";

// ── XP Values ───────────────────────────────────────────────

export const XP_VALUES = {
  add_pattern: 10,
  add_cover_photo: 5,
  add_thread_to_pattern: 2,
  mark_kitted: 15,
  log_wip_progress: 10,
  write_journal: 8,
  mark_finished: 50,
  add_fo_photo: 10,
  add_ffo_photo: 10,
  add_thread_inventory: 1,
  complete_challenge: 100,
  streak_7: 75,
  streak_30: 300,
} as const;

// ── Level System ────────────────────────────────────────────

export const LEVELS = [
  { level: 1, title: "Apprentice Stitcher", xpRequired: 0 },
  { level: 2, title: "Journeyman Stitcher", xpRequired: 200 },
  { level: 3, title: "Skilled Stitcher", xpRequired: 600 },
  { level: 4, title: "Expert Stitcher", xpRequired: 1500 },
  { level: 5, title: "Master Stitcher", xpRequired: 3500 },
  { level: 6, title: "Grand Master Stitcher", xpRequired: 7000 },
] as const;

export function getLevelForXp(xp: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const currentLevel = getLevelForXp(xp);
  const nextLevelIdx = LEVELS.findIndex((l) => l.level === currentLevel.level) + 1;
  if (nextLevelIdx >= LEVELS.length) {
    return { current: xp, needed: 0, progress: 1 };
  }
  const nextLevel = LEVELS[nextLevelIdx];
  const xpIntoLevel = xp - currentLevel.xpRequired;
  const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
  return {
    current: xpIntoLevel,
    needed: xpNeeded,
    progress: xpNeeded > 0 ? xpIntoLevel / xpNeeded : 1,
  };
}

// ── Streak Logic ────────────────────────────────────────────

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getDateString();
}

export function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === getDateString(yesterday);
}

export function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  return getDateString(monday);
}

/**
 * Calculate the new streak after an activity.
 * Returns updated streak fields + any celebrations triggered.
 */
export function calculateStreakUpdate(profile: Pick<Profile, "current_streak" | "longest_streak" | "last_activity_date" | "streak_freeze_used_this_week" | "freeze_week_start">): {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_freeze_used_this_week: boolean;
  freeze_week_start: string | null;
  celebrations: CelebrationData[];
} {
  const today = getDateString();
  const celebrations: CelebrationData[] = [];

  // Already logged today — no streak change
  if (isToday(profile.last_activity_date)) {
    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_activity_date: today,
      streak_freeze_used_this_week: profile.streak_freeze_used_this_week,
      freeze_week_start: profile.freeze_week_start,
      celebrations: [],
    };
  }

  let newStreak = profile.current_streak;
  let freezeUsed = profile.streak_freeze_used_this_week;
  let freezeWeekStart = profile.freeze_week_start;

  // Reset freeze tracking at the start of a new week
  const currentWeekStart = getWeekStart();
  if (freezeWeekStart !== currentWeekStart) {
    freezeUsed = false;
    freezeWeekStart = currentWeekStart;
  }

  if (isYesterday(profile.last_activity_date)) {
    // Consecutive day — increment streak
    newStreak += 1;
  } else if (profile.last_activity_date && !isYesterday(profile.last_activity_date)) {
    // Missed days — check if freeze can save it
    const lastDate = new Date(profile.last_activity_date);
    const daysBefore = new Date();
    daysBefore.setDate(daysBefore.getDate() - 2);
    const missedOnlyOneDay =
      lastDate.toISOString().split("T")[0] === getDateString(daysBefore);

    if (missedOnlyOneDay && !freezeUsed) {
      // Freeze saves the streak
      newStreak += 1; // count today
      freezeUsed = true;
    } else {
      // Streak broken
      newStreak = 1;
    }
  } else {
    // No previous activity — starting fresh
    newStreak = 1;
  }

  const newLongest = Math.max(profile.longest_streak, newStreak);

  // Check for streak milestones
  const milestones = STREAK_MILESTONES.filter(
    (m) => newStreak >= m.days && profile.current_streak < m.days
  );
  for (const m of milestones) {
    celebrations.push({
      type: "streak_milestone",
      title: `${m.days}-Day Streak!`,
      subtitle: m.message,
      streakCount: newStreak,
      badgeIcon: "🔥",
    });
  }

  return {
    current_streak: newStreak,
    longest_streak: newLongest,
    last_activity_date: today,
    streak_freeze_used_this_week: freezeUsed,
    freeze_week_start: freezeWeekStart,
    celebrations,
  };
}

// ── Streak Milestones ───────────────────────────────────────

export const STREAK_MILESTONES = [
  { days: 3, message: "You're building a habit!", badge: "streak_3" },
  { days: 7, message: "One full week! Your dogs are proud of you!", badge: "streak_7" },
  { days: 14, message: "Two weeks strong!", badge: "streak_14" },
  { days: 30, message: "A whole month of stitching! You're incredible!", badge: "streak_30" },
  { days: 50, message: "Fifty days! You're basically a stitching machine!", badge: "streak_50" },
  { days: 100, message: "ONE HUNDRED DAYS! This deserves a party!", badge: "streak_100" },
  { days: 365, message: "A full year! You are a Grand Master Stitcher.", badge: "streak_365" },
] as const;

// ── Achievement Definitions ─────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnDescription: string;
  category: "collection" | "finishing" | "stash" | "streak" | "special";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Collection
  { id: "first_stitch", name: "First Stitch", icon: "🪡", description: "Added your first pattern", earnDescription: "Add your first pattern", category: "collection" },
  { id: "growing_collection", name: "Growing Collection", icon: "📚", description: "10 patterns added", earnDescription: "Add 10 patterns to your collection", category: "collection" },
  { id: "bookshelf", name: "Bookshelf", icon: "📖", description: "25 patterns added", earnDescription: "Add 25 patterns to your collection", category: "collection" },
  { id: "the_library", name: "The Library", icon: "🏛️", description: "50 patterns added", earnDescription: "Add 50 patterns to your collection", category: "collection" },
  { id: "the_archive", name: "The Archive", icon: "👑", description: "100 patterns added", earnDescription: "Add 100 patterns to your collection", category: "collection" },
  // Finishing
  { id: "snip_snip", name: "Snip Snip", icon: "✂️", description: "Finished your first WIP", earnDescription: "Finish your first project", category: "finishing" },
  { id: "maker", name: "Maker", icon: "✨", description: "5 finished pieces", earnDescription: "Finish 5 projects", category: "finishing" },
  { id: "prolific", name: "Prolific", icon: "🎨", description: "10 finished pieces", earnDescription: "Finish 10 projects", category: "finishing" },
  { id: "master_finisher", name: "Master Finisher", icon: "🏆", description: "25 finished pieces", earnDescription: "Finish 25 projects", category: "finishing" },
  // Stash
  { id: "color_me_happy", name: "Color Me Happy", icon: "🧵", description: "25 threads in stash", earnDescription: "Add 25 threads to your stash", category: "stash" },
  { id: "rainbow_stash", name: "Rainbow Stash", icon: "🌈", description: "100 threads in stash", earnDescription: "Add 100 threads to your stash", category: "stash" },
  { id: "stash_whisperer", name: "The Stash Whisperer", icon: "🗄️", description: "250 threads in stash", earnDescription: "Add 250 threads to your stash", category: "stash" },
  // Streak
  { id: "spark", name: "Spark", icon: "🔥", description: "3-day streak", earnDescription: "Reach a 3-day streak", category: "streak" },
  { id: "on_fire", name: "On Fire", icon: "🔥", description: "7-day streak", earnDescription: "Reach a 7-day streak", category: "streak" },
  { id: "dedicated", name: "Dedicated", icon: "💪", description: "30-day streak", earnDescription: "Reach a 30-day streak", category: "streak" },
  { id: "unstoppable", name: "Unstoppable", icon: "🌟", description: "100-day streak", earnDescription: "Reach a 100-day streak", category: "streak" },
  { id: "legendary", name: "Legendary", icon: "👑", description: "365-day streak", earnDescription: "Reach a 365-day streak", category: "streak" },
  // Special
  { id: "kit_ready", name: "Kit Ready", icon: "🧺", description: "First pattern marked Kitted", earnDescription: "Mark your first pattern as Kitted", category: "special" },
  { id: "organized", name: "Organized", icon: "📷", description: "10 patterns with cover photos", earnDescription: "Add cover photos to 10 patterns", category: "special" },
  { id: "journal_keeper", name: "Journal Keeper", icon: "📓", description: "10 WIP journal entries", earnDescription: "Write 10 WIP journal entries", category: "special" },
  { id: "smart_shopper", name: "Smart Shopper", icon: "🛍️", description: "Used Store Mode", earnDescription: "Use Store Mode for the first time", category: "special" },
  { id: "tech_savvy", name: "Tech-Savvy Stitcher", icon: "🤖", description: "Used AI cover scan", earnDescription: "Scan a pattern cover with AI", category: "special" },
  { id: "fur_baby_fan", name: "Fur Baby's Biggest Fan", icon: "🐾", description: "Added 3+ pets", earnDescription: "Add 3 or more pets in onboarding", category: "special" },
];

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// ── Achievement Checking ────────────────────────────────────

export interface AchievementCheckContext {
  patternCount: number;
  finishedCount: number;
  threadCount: number;
  currentStreak: number;
  kittedCount: number;
  coverPhotoCount: number;
  journalEntryCount: number;
  usedStoreMode: boolean;
  usedAiScan: boolean;
  petCount: number;
}

/**
 * Given current stats, returns achievement IDs that should be earned.
 * Compare against already-earned to find newly unlocked ones.
 */
export function checkAchievements(ctx: AchievementCheckContext): string[] {
  const earned: string[] = [];

  // Collection
  if (ctx.patternCount >= 1) earned.push("first_stitch");
  if (ctx.patternCount >= 10) earned.push("growing_collection");
  if (ctx.patternCount >= 25) earned.push("bookshelf");
  if (ctx.patternCount >= 50) earned.push("the_library");
  if (ctx.patternCount >= 100) earned.push("the_archive");

  // Finishing
  if (ctx.finishedCount >= 1) earned.push("snip_snip");
  if (ctx.finishedCount >= 5) earned.push("maker");
  if (ctx.finishedCount >= 10) earned.push("prolific");
  if (ctx.finishedCount >= 25) earned.push("master_finisher");

  // Stash
  if (ctx.threadCount >= 25) earned.push("color_me_happy");
  if (ctx.threadCount >= 100) earned.push("rainbow_stash");
  if (ctx.threadCount >= 250) earned.push("stash_whisperer");

  // Streak
  if (ctx.currentStreak >= 3) earned.push("spark");
  if (ctx.currentStreak >= 7) earned.push("on_fire");
  if (ctx.currentStreak >= 30) earned.push("dedicated");
  if (ctx.currentStreak >= 100) earned.push("unstoppable");
  if (ctx.currentStreak >= 365) earned.push("legendary");

  // Special
  if (ctx.kittedCount >= 1) earned.push("kit_ready");
  if (ctx.coverPhotoCount >= 10) earned.push("organized");
  if (ctx.journalEntryCount >= 10) earned.push("journal_keeper");
  if (ctx.usedStoreMode) earned.push("smart_shopper");
  if (ctx.usedAiScan) earned.push("tech_savvy");
  if (ctx.petCount >= 3) earned.push("fur_baby_fan");

  return earned;
}

// ── Challenge Definitions ───────────────────────────────────

export interface ChallengeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  goal: number;
  actionType: string; // maps to what increments progress
}

const ALL_CHALLENGES: ChallengeDef[] = [
  { id: "stitch_sprint", name: "Stitch Sprint", icon: "🏃", description: "Log WIP progress 5 days this month", goal: 5, actionType: "log_progress" },
  { id: "scanathon", name: "Scan-a-thon", icon: "📸", description: "Add 3 new patterns to your collection", goal: 3, actionType: "add_pattern" },
  { id: "finish_line", name: "Finish Line", icon: "🏁", description: "Complete 1 WIP this month", goal: 1, actionType: "finish_pattern" },
  { id: "stash_keeper", name: "Stash Keeper", icon: "🧶", description: "Add 10 threads to your inventory", goal: 10, actionType: "add_thread" },
  { id: "kitting_day", name: "Kitting Day", icon: "🧺", description: "Kit 2 patterns", goal: 2, actionType: "kit_pattern" },
  { id: "photo_day", name: "Photo Day", icon: "📷", description: "Add cover photos to 5 patterns", goal: 5, actionType: "add_cover_photo" },
  { id: "journal_habit", name: "Journal Habit", icon: "📓", description: "Write 3 journal entries", goal: 3, actionType: "write_journal" },
  { id: "deep_dive", name: "The Deep Dive", icon: "🔍", description: "Scan a color key and add all threads", goal: 1, actionType: "scan_colorkey" },
  { id: "spring_clean", name: "Collection Spring Clean", icon: "🧹", description: "Review and update 5 existing patterns", goal: 5, actionType: "update_pattern" },
];

/**
 * Get 3 challenges for a given month.
 * Deterministic based on month string (e.g. "2026-03").
 */
export function getChallengesForMonth(month: string): ChallengeDef[] {
  // Use month string to seed a simple hash for deterministic selection
  let hash = 0;
  for (let i = 0; i < month.length; i++) {
    hash = ((hash << 5) - hash + month.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);

  // Shuffle using the seed
  const shuffled = [...ALL_CHALLENGES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

// ── Streak display helpers ──────────────────────────────────

export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Day 1 — Today's the day!";
  if (streak < 7) return `${streak} days — Keep it going!`;
  if (streak === 7) return "One week! Amazing!";
  if (streak < 30) return `${streak} days — You're on a roll!`;
  if (streak === 30) return "A whole month! Incredible!";
  if (streak < 100) return `${streak} days — Unstoppable!`;
  if (streak === 100) return "ONE HUNDRED DAYS!";
  if (streak < 365) return `${streak} days — Legendary status incoming!`;
  return `${streak} days — You are a Grand Master Stitcher!`;
}

export function getWeekActivityDots(lastActivityDate: string | null, currentStreak: number): boolean[] {
  const today = new Date();
  const dots: boolean[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getDateString(d);

    if (!lastActivityDate) {
      dots.push(false);
      continue;
    }

    // If this date is within the streak range from last_activity_date
    const lastDate = new Date(lastActivityDate);
    const streakStart = new Date(lastDate);
    streakStart.setDate(lastDate.getDate() - currentStreak + 1);

    const dayDate = new Date(dateStr);
    dots.push(dayDate >= streakStart && dayDate <= lastDate);
  }

  return dots;
}

// ── Celebration builders ────────────────────────────────────

export function buildFinishCelebration(
  patternName: string,
  coverPhotoUrl: string | null,
  displayName: string,
  dogName: string | null,
  stats?: { daysWorked?: number; journalEntries?: number; stitches?: number }
): CelebrationData {
  const statItems: { label: string; value: string }[] = [];
  if (stats?.daysWorked) statItems.push({ label: "Days worked", value: `${stats.daysWorked}` });
  if (stats?.journalEntries) statItems.push({ label: "Journal entries", value: `${stats.journalEntries}` });
  if (stats?.stitches) statItems.push({ label: "Stitches", value: stats.stitches.toLocaleString() });

  return {
    type: "pattern_finished",
    title: "Finished!",
    subtitle: `You did it, ${displayName}! This is beautiful!`,
    dogLine: dogName ? `${dogName} is SO proud of you!` : undefined,
    patternName,
    coverPhotoUrl: coverPhotoUrl ?? undefined,
    stats: statItems.length > 0 ? statItems : undefined,
  };
}

export function buildBadgeCelebration(achievementId: string): CelebrationData | null {
  const def = getAchievementDef(achievementId);
  if (!def) return null;
  return {
    type: "badge_earned",
    title: "New Badge!",
    subtitle: `You earned "${def.name}"!`,
    badgeIcon: def.icon,
    badgeName: def.name,
  };
}

export function buildLevelUpCelebration(newLevel: number): CelebrationData {
  const levelDef = LEVELS.find((l) => l.level === newLevel) ?? LEVELS[0];
  return {
    type: "level_up",
    title: `Level ${newLevel}!`,
    subtitle: `You've reached ${levelDef.title}!`,
    levelTitle: levelDef.title,
    badgeIcon: "⭐",
  };
}

export function buildFirstPatternCelebration(): CelebrationData {
  return {
    type: "first_pattern",
    title: "Your collection has begun!",
    subtitle: "Every great archive starts with one. This is yours.",
  };
}
