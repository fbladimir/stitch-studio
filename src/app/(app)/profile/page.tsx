"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { StreakCard } from "@/components/engagement/StreakCard";
import { AchievementShelf } from "@/components/engagement/AchievementShelf";
import { LevelBadge } from "@/components/engagement/LevelBadge";
import { XpBar } from "@/components/engagement/XpBar";
import { useTutorial } from "@/hooks/useTutorial";
import type { Profile, Achievement } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { restartTutorial } = useTutorial();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, achievementsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("achievements").select("*").eq("user_id", user.id),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    setAchievements((achievementsRes.data as Achievement[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <>
        <TopBar title="Profile" />
        <PageWrapper>
          <div className="space-y-4 pt-4">
            <div className="skeleton h-32 w-full" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        </PageWrapper>
      </>
    );
  }

  if (!profile) return null;

  const dogs = Array.isArray(profile.dogs) ? profile.dogs : [];

  return (
    <>
      <TopBar title="Profile" />
      <PageWrapper className="pb-8">
        {/* ── Profile header ──────────────────────────────── */}
        <section className="pt-4 pb-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-[#F5EEE8] border-4 border-white shadow-md overflow-hidden flex items-center justify-center mb-3">
            {profile.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_photo_url}
                alt={profile.display_name ?? "Profile"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-4xl opacity-40">👤</span>
            )}
          </div>

          <h1 className="font-playfair text-2xl font-bold text-[#3A2418]">
            {profile.display_name ?? "Stitcher"}
          </h1>

          {/* Dogs */}
          {dogs.length > 0 && (
            <p className="font-nunito text-[13px] text-[#896E66] mt-1">
              {dogs.map((d) => `${d.emoji} ${d.name}`).join(" · ")}
            </p>
          )}

          {/* Level badge */}
          <div className="mt-3">
            <LevelBadge level={profile.level ?? 1} size="lg" />
          </div>
        </section>

        {/* ── XP Progress ─────────────────────────────────── */}
        <section className="mb-6 bg-white rounded-2xl border border-[#E4D6C8] px-4 py-4" style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}>
          <XpBar totalXp={profile.total_xp ?? 0} />
        </section>

        {/* ── Streak ──────────────────────────────────────── */}
        <section className="mb-6">
          <StreakCard
            currentStreak={profile.current_streak ?? 0}
            longestStreak={profile.longest_streak ?? 0}
            lastActivityDate={profile.last_activity_date}
          />
        </section>

        {/* ── Achievements ────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="font-playfair text-lg font-bold text-[#3A2418] mb-4">
            Achievement Shelf
          </h2>
          <AchievementShelf earned={achievements} />
        </section>

        {/* ── Actions ─────────────────────────────────────── */}
        <section className="space-y-3 mb-6">
          <button
            onClick={restartTutorial}
            className="w-full py-3 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] text-center font-nunito text-[14px] font-bold text-[#B36050] active:scale-[0.98] transition-transform"
          >
            🐾 Restart App Tour
          </button>

          <Link
            href="/dashboard"
            className="block w-full py-3 rounded-xl bg-white border border-[#E4D6C8] text-center font-nunito text-[14px] font-bold text-[#3A2418] active:scale-[0.98] transition-transform"
          >
            Back to Dashboard
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl bg-white border border-[#E4D6C8] text-center font-nunito text-[14px] font-bold text-[#B03020] active:scale-[0.98] transition-transform"
          >
            Sign Out
          </button>
        </section>
      </PageWrapper>
    </>
  );
}
