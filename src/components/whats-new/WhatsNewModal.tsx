"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// ============================================================
// What's New — Versioned update announcements
// ============================================================
//
// Each update has an id, which is stored in localStorage when
// dismissed. The modal only shows once per update, and sequences
// after the DailyGreeting so overlays don't collide.
// ============================================================

// ── Update definitions ───────────────────────────────────────
// Add new updates to the TOP of this array. Only the latest
// unseen update is shown.

export interface UpdateFeature {
  icon: string;
  title: string;
  description: string;
}

export interface AppUpdate {
  id: string;                 // unique, monotonically increasing
  date: string;               // display date
  headline: string;           // main announcement
  subtitle: string;           // warm one-liner
  emoji: string;              // hero emoji
  features: UpdateFeature[];  // feature bullets
  ctaLabel: string;           // primary button text
  ctaHref: string;            // where the CTA navigates
  secondaryLabel?: string;    // optional dismiss text override
}

const UPDATES: AppUpdate[] = [
  {
    id: "2026-03-16-pets-stitches-sort",
    date: "March 2026",
    headline: "Forgot a Fur Baby?",
    subtitle: "Now you can add new fur babies anytime — plus exciting progress tracking!",
    emoji: "🐾",
    features: [
      {
        icon: "🐶",
        title: "Add Pets Anytime",
        description:
          "Forgot to add a fur baby during onboarding? Head to your Profile to add (or remove) pets whenever you want!",
      },
      {
        icon: "📊",
        title: "Total Stitches + Auto Percentage",
        description:
          "Enter your pattern's total stitch count on any WIP and the progress percentage calculates automatically — just like R-XP!",
      },
      {
        icon: "↕️",
        title: "Sort Your Collection",
        description:
          "Sort patterns by name, designer, date added, or progress. Tap the sort button at the top of your patterns list.",
      },
    ],
    ctaLabel: "Add a Fur Baby 🐾",
    ctaHref: "/profile",
    secondaryLabel: "I'm good!",
  },
  {
    id: "2026-03-14-import",
    date: "March 2026",
    headline: "Import Your Collection",
    subtitle: "Bring your stash home — no re-typing required!",
    emoji: "📦",
    features: [
      {
        icon: "📱",
        title: "Import from PatternKeeper, R-XP & Saga",
        description:
          "Upload a CSV export from your favourite cross stitch app and we'll bring your threads and patterns right in.",
      },
      {
        icon: "🧵",
        title: "Smart Duplicate Detection",
        description:
          "We'll check your existing stash so you don't end up with doubles. Already-owned threads are flagged automatically.",
      },
      {
        icon: "💾",
        title: "Export Your Data",
        description:
          "Download your full thread inventory or pattern collection as a CSV any time — your data is always yours.",
      },
    ],
    ctaLabel: "Show Me How ✿",
    ctaHref: "/settings",
    secondaryLabel: "Maybe later",
  },
];

// ── localStorage key ─────────────────────────────────────────

const STORAGE_KEY = "ss_whats_new_seen";

function getSeenUpdates(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  const seen = getSeenUpdates();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  }
}

function getLatestUnseen(): AppUpdate | null {
  const seen = getSeenUpdates();
  return UPDATES.find((u) => !seen.includes(u.id)) ?? null;
}

// ── Component ────────────────────────────────────────────────

interface WhatsNewModalProps {
  /** Call this after the DailyGreeting has been dismissed or skipped */
  onDismiss?: () => void;
  /** Set to true when the greeting is done and this modal can appear */
  ready?: boolean;
}

export function WhatsNewModal({ onDismiss, ready = true }: WhatsNewModalProps) {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const unseen = getLatestUnseen();
    if (unseen) {
      setUpdate(unseen);
      // Small delay so it doesn't flash instantly after greeting
      const t1 = setTimeout(() => setVisible(true), 400);
      const t2 = setTimeout(() => setAnimateIn(true), 460);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      // No update to show — pass through immediately
      onDismiss?.();
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    if (update) markSeen(update.id);
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 320);
  }, [update, onDismiss]);

  if (!visible || !update) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center"
      style={{
        opacity: animateIn ? 1 : 0,
        transition: "opacity 0.32s ease",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#3A2418]/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-[420px] mx-4 mb-0 sm:mb-0 rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden"
        style={{
          transform: animateIn ? "translateY(0)" : "translateY(40px)",
          transition: "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 -8px 40px rgba(58, 36, 24, 0.15), 0 2px 12px rgba(58, 36, 24, 0.08)",
        }}
      >
        {/* ── Decorative header gradient ─────────────── */}
        <div
          className="relative px-6 pt-8 pb-6 overflow-hidden"
          style={{
            background: "linear-gradient(155deg, #FDF4F1 0%, #FAF6F0 40%, #EBF2EC 100%)",
          }}
        >
          {/* Soft blob accents */}
          <div
            className="absolute top-[-30px] right-[-20px] w-40 h-40 rounded-full opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(circle, #F0C8BB, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-20px] left-[-15px] w-32 h-32 rounded-full opacity-25 pointer-events-none"
            style={{ background: "radial-gradient(circle, #C0D4C2, transparent 70%)" }}
          />

          {/* Badge + Hero */}
          <div className="relative flex flex-col items-center text-center">
            {/* "New" pill */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
              style={{
                background: "linear-gradient(135deg, #B36050, #CA8070)",
                boxShadow: "0 2px 10px rgba(179, 96, 80, 0.3)",
                animation: "fadeSlideUp 0.5s ease-out 0.1s both",
              }}
            >
              <span className="text-white text-[10px]">✦</span>
              <span className="font-nunito text-[11px] font-bold text-white uppercase tracking-wider">
                What&apos;s New
              </span>
              <span className="text-white text-[10px]">✦</span>
            </div>

            {/* Hero emoji */}
            <div
              className="text-5xl mb-3"
              style={{ animation: "popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both" }}
            >
              {update.emoji}
            </div>

            {/* Headline */}
            <h2
              className="font-playfair text-[26px] font-bold text-[#3A2418] leading-tight"
              style={{ animation: "fadeSlideUp 0.5s ease-out 0.25s both" }}
            >
              {update.headline}
            </h2>

            {/* Subtitle */}
            <p
              className="font-nunito text-[14px] text-[#5F7A63] mt-2 leading-relaxed"
              style={{ animation: "fadeSlideUp 0.5s ease-out 0.35s both" }}
            >
              {update.subtitle}
            </p>
          </div>
        </div>

        {/* ── Feature list ───────────────────────────── */}
        <div className="px-6 py-5 flex flex-col gap-3.5">
          {update.features.map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-[#FAF6F0] rounded-2xl px-4 py-3.5 border border-[#E4D6C8]/60"
              style={{
                animation: `fadeSlideUp 0.45s ease-out ${0.4 + i * 0.1}s both`,
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-[#E4D6C8]/40">
                <span className="text-lg">{feature.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-nunito text-[13px] font-bold text-[#3A2418] leading-tight">
                  {feature.title}
                </p>
                <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA buttons ────────────────────────────── */}
        <div
          className="px-6 pb-6 pt-1 flex flex-col gap-2.5"
          style={{
            animation: `fadeSlideUp 0.45s ease-out ${0.4 + update.features.length * 0.1}s both`,
            paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          }}
        >
          <Link
            href={update.ctaHref}
            onClick={dismiss}
            className="block w-full py-3.5 rounded-full text-center font-nunito font-bold text-[15px] text-white active:scale-[0.97] transition-transform"
            style={{
              background: "linear-gradient(135deg, #CA8070, #B36050)",
              boxShadow: "0 6px 20px rgba(179, 96, 80, 0.35)",
            }}
          >
            {update.ctaLabel}
          </Link>

          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-full text-center font-nunito font-semibold text-[13px] text-[#6B544D] active:scale-[0.97] transition-transform"
          >
            {update.secondaryLabel ?? "Dismiss"}
          </button>
        </div>

        {/* Date footnote */}
        <div className="absolute top-3 right-4">
          <span className="font-nunito text-[10px] text-[#9A8578] font-semibold">
            {update.date}
          </span>
        </div>
      </div>
    </div>
  );
}
