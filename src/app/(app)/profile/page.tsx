"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { StreakCard } from "@/components/engagement/StreakCard";
import { AchievementShelf } from "@/components/engagement/AchievementShelf";
import { LevelBadge } from "@/components/engagement/LevelBadge";
import { XpBar } from "@/components/engagement/XpBar";
import { useTutorial } from "@/hooks/useTutorial";
import type { Profile, Achievement, Dog } from "@/types";

const PET_EMOJIS = ["🐶", "🐱", "🐰", "🐹", "🐦", "🐠", "🐢", "🦜", "🐺", "🦊", "🐻", "🐼"];

export default function ProfilePage() {
  const router = useRouter();
  const { restartTutorial } = useTutorial();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  // Pet editor state
  const [showPetForm, setShowPetForm] = useState(false);
  const [petName, setPetName] = useState("");
  const [petEmoji, setPetEmoji] = useState("🐶");
  const [savingPets, setSavingPets] = useState(false);

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

  const saveDogs = async (newDogs: Dog[]) => {
    if (!profile) return;
    setSavingPets(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ dogs: newDogs, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, dogs: newDogs });
    }
    setSavingPets(false);
    return !error;
  };

  const addPet = async () => {
    if (!petName.trim()) return;
    const newDog: Dog = { id: crypto.randomUUID(), name: petName.trim(), emoji: petEmoji };
    const newDogs = [...(profile?.dogs ?? []), newDog];
    const ok = await saveDogs(newDogs);
    if (ok) {
      toast.success(`${petEmoji} ${petName.trim()} has joined the family!`);
      setPetName("");
      setPetEmoji("🐶");
      setShowPetForm(false);
    }
  };

  const removePet = async (id: string) => {
    const dog = dogs.find((d) => d.id === id);
    const newDogs = dogs.filter((d) => d.id !== id);
    const ok = await saveDogs(newDogs);
    if (ok && dog) {
      toast.success(`${dog.emoji} ${dog.name} removed (they'll miss you!)`);
    }
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
            <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
              {dogs.map((d) => `${d.emoji} ${d.name}`).join(" · ")}
            </p>
          )}

          {/* Level badge */}
          <div className="mt-3">
            <LevelBadge level={profile.level ?? 1} size="lg" />
          </div>
        </section>

        {/* ── Fur Babies ────────────────────────────────────── */}
        <section className="mb-6 bg-white rounded-2xl border border-[#E4D6C8] px-4 py-5" style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-playfair text-lg font-bold text-[#3A2418]">
              🐾 My Fur Babies
            </h2>
            {!showPetForm && (
              <button
                onClick={() => setShowPetForm(true)}
                className="font-nunito text-[12px] font-bold text-[#B36050] active:scale-95 transition-transform"
              >
                + Add pet
              </button>
            )}
          </div>

          {/* Pet pills */}
          {dogs.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="flex items-center gap-1.5 bg-[#FDF4F1] border border-[#F0C8BB] rounded-full pl-3 pr-1.5 py-1.5"
                >
                  <span className="text-lg">{dog.emoji}</span>
                  <span className="font-nunito text-[13px] font-semibold text-[#3A2418]">{dog.name}</span>
                  <button
                    onClick={() => removePet(dog.id)}
                    disabled={savingPets}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#C4AFA6] active:text-[#B03020] transition-colors disabled:opacity-40"
                    aria-label={`Remove ${dog.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : !showPetForm ? (
            <button
              onClick={() => setShowPetForm(true)}
              className="w-full py-6 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E4D6C8] active:border-[#B36050] active:bg-[#FDF4F1] transition-colors mb-3"
            >
              <span className="text-3xl">🐾</span>
              <p className="font-nunito text-[14px] font-bold text-[#3A2418]">
                Forgot a fur baby?
              </p>
              <p className="font-nunito text-[12px] text-[#6B544D]">
                Their feelings are hurt! Tap to add them.
              </p>
            </button>
          ) : null}

          {/* Add pet form */}
          {showPetForm && (
            <div className="bg-[#FDF4F1] rounded-2xl border border-[#F0C8BB] p-4 flex flex-col gap-3.5" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
              <div className="text-center">
                <p className="font-nunito text-[14px] font-bold text-[#3A2418]">
                  {dogs.length === 0 ? "Forgot a fur baby? 😱" : "Another fur baby? The more the merrier! 🎉"}
                </p>
                <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5">
                  {dogs.length === 0
                    ? "Quick, add them before they notice!"
                    : "We love a full house!"}
                </p>
              </div>

              <div>
                <label className="font-nunito text-[12px] font-semibold text-[#3A2418] block mb-1">
                  Pet&apos;s name
                </label>
                <input
                  placeholder="e.g. Rokuu"
                  autoFocus
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPet()}
                  className="w-full h-11 px-3 rounded-xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578]"
                />
              </div>

              <div>
                <label className="font-nunito text-[12px] font-semibold text-[#3A2418] block mb-1">
                  Pick an emoji
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setPetEmoji(emoji)}
                      className={`w-10 h-10 text-xl rounded-xl transition-all ${
                        petEmoji === emoji
                          ? "bg-[#B36050] shadow-md scale-110"
                          : "bg-white border border-[#E4D6C8]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={addPet}
                  disabled={!petName.trim() || savingPets}
                  className="flex-1 h-11 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[14px] disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  {savingPets ? "Adding…" : `Add ${petEmoji}`}
                </button>
                <button
                  onClick={() => { setShowPetForm(false); setPetName(""); setPetEmoji("🐶"); }}
                  className="px-5 h-11 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito text-[13px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
          <Link
            href="/settings"
            className="block w-full py-3 rounded-xl bg-white border border-[#E4D6C8] text-center font-nunito text-[14px] font-bold text-[#3A2418] active:scale-[0.98] transition-transform"
          >
            ⚙️ Settings & Import
          </Link>

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
