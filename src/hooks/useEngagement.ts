"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import type { Achievement, ChallengeProgress, Profile } from "@/types";
import {
  calculateStreakUpdate,
  checkAchievements,
  buildBadgeCelebration,
  buildLevelUpCelebration,
  getChallengesForMonth,
  getCurrentMonth,
  getLevelForXp,
  getXpToNextLevel,
  XP_VALUES,
  type AchievementCheckContext,
} from "@/lib/engagement";

interface EngagementState {
  profile: Profile | null;
  achievements: Achievement[];
  challenges: ChallengeProgress[];
  loading: boolean;
}

export function useEngagement() {
  const [state, setState] = useState<EngagementState>({
    profile: null,
    achievements: [],
    challenges: [],
    loading: true,
  });

  const pushCelebrations = useAppStore((s) => s.pushCelebrations);
  const pushCelebration = useAppStore((s) => s.pushCelebration);

  // ── Load engagement data ───────────────────────────────────
  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const month = getCurrentMonth();
    const [profileRes, achievementsRes, challengesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("achievements").select("*").eq("user_id", user.id),
      supabase
        .from("challenge_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", month),
    ]);

    const profile = profileRes.data as Profile | null;
    const achievements = (achievementsRes.data as Achievement[]) ?? [];
    let challenges = (challengesRes.data as ChallengeProgress[]) ?? [];

    // Initialize challenges for this month if none exist
    if (challenges.length === 0 && profile) {
      const defs = getChallengesForMonth(month);
      const newChallenges = defs.map((d) => ({
        user_id: user.id,
        challenge_id: d.id,
        month,
        progress: 0,
        goal: d.goal,
        completed: false,
      }));
      const { data } = await supabase
        .from("challenge_progress")
        .upsert(newChallenges, { onConflict: "user_id,challenge_id,month" })
        .select();
      challenges = (data as ChallengeProgress[]) ?? [];
    }

    setState({
      profile,
      achievements,
      challenges,
      loading: false,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Record an activity (updates streak, XP, checks achievements) ──
  const recordActivity = useCallback(
    async (
      action: keyof typeof XP_VALUES,
      extraContext?: Partial<AchievementCheckContext>
    ) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch fresh profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!profileData) return;

      const profile = profileData as Profile;
      const xpGain = XP_VALUES[action];
      const newXp = profile.total_xp + xpGain;
      const oldLevel = getLevelForXp(profile.total_xp);
      const newLevel = getLevelForXp(newXp);

      // Streak update
      const streakUpdate = calculateStreakUpdate(profile);

      // Build profile update
      const profileUpdate: Record<string, unknown> = {
        total_xp: newXp,
        level: newLevel.level,
        current_streak: streakUpdate.current_streak,
        longest_streak: streakUpdate.longest_streak,
        last_activity_date: streakUpdate.last_activity_date,
        streak_freeze_used_this_week: streakUpdate.streak_freeze_used_this_week,
        freeze_week_start: streakUpdate.freeze_week_start,
        updated_at: new Date().toISOString(),
      };

      await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

      // Queue streak celebrations
      if (streakUpdate.celebrations.length > 0) {
        pushCelebrations(streakUpdate.celebrations);
      }

      // Level up celebration
      if (newLevel.level > oldLevel.level) {
        pushCelebration(buildLevelUpCelebration(newLevel.level));
      }

      // Check achievements
      if (extraContext) {
        const ctx: AchievementCheckContext = {
          patternCount: extraContext.patternCount ?? 0,
          finishedCount: extraContext.finishedCount ?? 0,
          threadCount: extraContext.threadCount ?? 0,
          currentStreak: streakUpdate.current_streak,
          kittedCount: extraContext.kittedCount ?? 0,
          coverPhotoCount: extraContext.coverPhotoCount ?? 0,
          journalEntryCount: extraContext.journalEntryCount ?? 0,
          usedStoreMode: extraContext.usedStoreMode ?? false,
          usedAiScan: extraContext.usedAiScan ?? false,
          petCount: extraContext.petCount ?? 0,
        };

        const shouldHave = checkAchievements(ctx);
        const { data: existing } = await supabase
          .from("achievements")
          .select("achievement_id")
          .eq("user_id", user.id);
        const existingIds = new Set(
          (existing ?? []).map((a: { achievement_id: string }) => a.achievement_id)
        );

        const newBadges = shouldHave.filter((id) => !existingIds.has(id));
        if (newBadges.length > 0) {
          await supabase.from("achievements").insert(
            newBadges.map((id) => ({ user_id: user.id, achievement_id: id }))
          );

          // Queue badge celebrations
          for (const id of newBadges) {
            const c = buildBadgeCelebration(id);
            if (c) pushCelebration(c);
          }
        }
      }

      // Update challenge progress
      const month = getCurrentMonth();
      const challengeActionMap: Record<string, string> = {
        add_pattern: "add_pattern",
        mark_finished: "finish_pattern",
        add_thread_inventory: "add_thread",
        mark_kitted: "kit_pattern",
        add_cover_photo: "add_cover_photo",
        write_journal: "write_journal",
        log_wip_progress: "log_progress",
      };

      const challengeAction = challengeActionMap[action];
      if (challengeAction) {
        const monthChallenges = getChallengesForMonth(month);
        const matching = monthChallenges.filter(
          (c) => c.actionType === challengeAction
        );
        for (const ch of matching) {
          const { data: current } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("challenge_id", ch.id)
            .eq("month", month)
            .single();

          if (current && !current.completed) {
            const newProgress = (current.progress || 0) + 1;
            const completed = newProgress >= ch.goal;
            await supabase
              .from("challenge_progress")
              .update({
                progress: newProgress,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
              })
              .eq("id", current.id);
          }
        }
      }

      // Reload state
      await load();
    },
    [load, pushCelebration, pushCelebrations]
  );

  const levelInfo = state.profile
    ? {
        level: getLevelForXp(state.profile.total_xp),
        xpProgress: getXpToNextLevel(state.profile.total_xp),
      }
    : null;

  return {
    ...state,
    levelInfo,
    recordActivity,
    reload: load,
  };
}
