"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DailyGreeting } from "@/components/dashboard/DailyGreeting";
import type { Profile, Pattern } from "@/types";

// ── Types ─────────────────────────────────────────────────────

interface Stats {
  totalPatterns: number;
  wips: number;
  finished: number;
  threads: number;
}

type RecentPattern = Pick<
  Pattern,
  "id" | "name" | "designer" | "cover_photo_url" | "wip" | "wip_pct" | "kitted" | "completion_date" | "last_progress_date"
>;

// ── Helpers ───────────────────────────────────────────────────

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Hello";
}

function statusLabel(p: RecentPattern) {
  if (p.completion_date) return { text: "Finished ✓", classes: "bg-[#EBF2EC] text-[#5F7A63]" };
  if (p.wip) return { text: `WIP · ${p.wip_pct}%`, classes: "bg-[#FBF5E8] text-[#AE7C2A]" };
  if (p.kitted) return { text: "Kitted", classes: "bg-[#FDF4F1] text-[#B36050]" };
  return { text: "Not started", classes: "bg-[#F5EEE8] text-[#896E66]" };
}

function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

// ── Quick Actions ─────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    icon: "📸",
    label: "Scan New Pattern",
    desc: "Add via photo",
    href: "/patterns/new",
    bg: "bg-[#FDF4F1]",
    border: "border-[#F0C8BB]",
    iconBg: "bg-[#F0C8BB]",
  },
  {
    icon: "🧺",
    label: "Kitting Check",
    desc: "What do I have?",
    href: "/kitting",
    bg: "bg-[#EBF2EC]",
    border: "border-[#C0D4C2]",
    iconBg: "bg-[#C8DEC9]",
  },
  {
    icon: "⏱️",
    label: "Log Progress",
    desc: "Update a WIP",
    href: "/patterns",
    bg: "bg-[#FBF5E8]",
    border: "border-[#E8D5A0]",
    iconBg: "bg-[#EDD898]",
  },
  {
    icon: "🛍️",
    label: "I'm Shopping!",
    desc: "In-store helper",
    href: "/store-mode",
    bg: "bg-[#FDF4F1]",
    border: "border-[#F0C8BB]",
    iconBg: "bg-[#F0C8BB]",
  },
];

// ── Pick 2 daily-random dogs ──────────────────────────────────

function pickTwoDogs(dogs: Profile["dogs"]): Profile["dogs"] {
  if (dogs.length <= 2) return dogs;
  // Seed by day-of-year so the pair is stable within a day but rotates daily
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const i1 = dayOfYear % dogs.length;
  const i2 = (dayOfYear + Math.ceil(dogs.length / 2)) % dogs.length;
  if (i1 === i2) return [dogs[i1], dogs[(i1 + 1) % dogs.length]];
  return [dogs[i1], dogs[i2]];
}

// ── Main page ─────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentPattern[] | null>(null);
  const [wipNudge, setWipNudge] = useState<RecentPattern | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, patternsRes, threadCountRes, staleWipRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single(),

          supabase
            .from("patterns")
            .select(
              "id, name, designer, cover_photo_url, wip, wip_pct, kitted, completion_date, last_progress_date, updated_at"
            )
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),

          supabase
            .from("thread_inventory")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),

          supabase
            .from("patterns")
            .select("id, name, wip_pct, last_progress_date, cover_photo_url, kitted, completion_date, designer")
            .eq("user_id", user.id)
            .eq("wip", true)
            .or(
              `last_progress_date.is.null,last_progress_date.lt.${new Date(
                Date.now() - 7 * 86400000
              ).toISOString()}`
            )
            .limit(1),
        ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);

      if (patternsRes.data) {
        const all = patternsRes.data;
        setStats({
          totalPatterns: all.length,
          wips: all.filter((p) => p.wip).length,
          finished: all.filter((p) => p.completion_date).length,
          threads: threadCountRes.count ?? 0,
        });
        setRecent(all.slice(0, 3) as RecentPattern[]);
      } else {
        setStats({ totalPatterns: 0, wips: 0, finished: 0, threads: 0 });
        setRecent([]);
      }

      if (staleWipRes.data?.[0]) {
        setWipNudge(staleWipRes.data[0] as unknown as RecentPattern);
      }
    };

    load();
  }, []);

  const loading = !profile || !stats || !recent;
  const allDogs = profile?.dogs ?? [];
  const dogs = pickTwoDogs(allDogs);

  return (
    <>
      <DailyGreeting />

      <PageWrapper className="pb-8">
        {/* ── Greeting header ─────────────────────────────────── */}
        <section className="pt-2 pb-5">
          {loading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="font-playfair text-[28px] font-bold text-[#3A2418] leading-tight">
                {getTimeGreeting()},{" "}
                <span className="text-[#B36050]">
                  {profile?.display_name ?? "friend"}
                </span>
                ! ✿
              </h1>

              {allDogs.length > 0 && (
                <p className="font-nunito text-[13px] text-[#896E66] mt-1.5">
                  {dogs.map((d) => `${d.emoji} ${d.name}`).join(" & ")}{" "}
                  send tail wags 🐾
                </p>
              )}
            </>
          )}
        </section>

        {/* ── Stats row ───────────────────────────────────────── */}
        <section className="mb-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: stats!.totalPatterns, label: "Patterns", icon: "📖", color: "text-[#B36050]", href: "/patterns" },
                { value: stats!.wips, label: "In Progress", icon: "⏱️", color: "text-[#AE7C2A]", href: "/patterns?filter=wip" },
                { value: stats!.finished, label: "Finished", icon: "✓", color: "text-[#5F7A63]", href: "/patterns?filter=finished" },
                { value: stats!.threads, label: "Threads", icon: "🧵", color: "text-[#896E66]", href: "/threads" },
              ].map(({ value, label, icon, color, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="bg-white rounded-2xl border border-[#E4D6C8] px-4 py-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
                  style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className={`font-playfair text-2xl font-bold leading-none ${color}`}>
                      {value}
                    </p>
                    <p className="font-nunito text-[11px] text-[#896E66] font-semibold mt-0.5 uppercase tracking-wide">
                      {label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Actions ────────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="font-playfair text-lg font-bold text-[#3A2418] mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ icon, label, desc, href, bg, border, iconBg }) => (
              <Link
                key={label}
                href={href}
                className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-2 active:scale-95 transition-transform min-h-[88px]`}
                style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
              >
                <span
                  className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}
                >
                  {icon}
                </span>
                <div>
                  <p className="font-nunito font-bold text-[13px] text-[#3A2418] leading-tight">
                    {label}
                  </p>
                  <p className="font-nunito text-[11px] text-[#896E66] mt-0.5">
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── WIP nudge ────────────────────────────────────────── */}
        {wipNudge && (
          <section className="mb-6">
            <Link
              href="/patterns"
              className="block bg-[#FBF5E8] border border-[#E8D5A0] rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">⏳</span>
                <div className="flex-1">
                  <p className="font-nunito font-bold text-[13px] text-[#3A2418]">
                    &ldquo;{wipNudge.name}&rdquo; is waiting for you!
                  </p>
                  <p className="font-nunito text-[12px] text-[#896E66] mt-0.5">
                    {wipNudge.last_progress_date
                      ? `No update in ${daysSince(wipNudge.last_progress_date)} days — ready to keep going?`
                      : "You haven't logged any progress yet — ready to start?"}
                  </p>
                </div>
                <span className="text-[#AE7C2A] font-bold text-lg">›</span>
              </div>
            </Link>
          </section>
        )}

        {/* ── Recent Patterns ──────────────────────────────────── */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-playfair text-lg font-bold text-[#3A2418]">
              Recent Patterns
            </h2>
            <Link
              href="/patterns"
              className="font-nunito text-[13px] font-semibold text-[#B36050]"
            >
              See all →
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recent!.length === 0 ? (
            <div className="bg-white border border-[#E4D6C8] rounded-2xl px-5 py-8 text-center">
              <p className="text-3xl mb-2">🪡</p>
              <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
                No patterns yet!
              </p>
              <p className="font-nunito text-[12px] text-[#896E66] mt-1">
                Tap &ldquo;Scan New Pattern&rdquo; above to add your first one.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recent!.map((p) => {
                const badge = statusLabel(p);
                return (
                  <Link
                    key={p.id}
                    href={`/patterns/${p.id}`}
                    className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
                    style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
                  >
                    {/* Thumbnail */}
                    <div className="w-[72px] h-[72px] flex-shrink-0 bg-[#F5EEE8] flex items-center justify-center rounded-l-2xl overflow-hidden">
                      {p.cover_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.cover_photo_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl opacity-40">📖</span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 py-3 min-w-0">
                      <p className="font-nunito font-bold text-[13px] text-[#3A2418] truncate leading-tight">
                        {p.name}
                      </p>
                      {p.designer && (
                        <p className="font-nunito text-[11px] text-[#896E66] mt-0.5 truncate">
                          {p.designer}
                        </p>
                      )}
                      <span
                        className={`inline-block mt-1.5 px-2 py-0.5 rounded-full font-nunito text-[10px] font-bold ${badge.classes}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <span className="text-[#C4AFA6] font-bold text-lg flex-shrink-0">›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </PageWrapper>
    </>
  );
}
