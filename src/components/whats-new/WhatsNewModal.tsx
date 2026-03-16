"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// ============================================================
// What's New — Versioned update announcements
// ============================================================

export interface UpdateFeature {
  icon: string;
  text: string;
}

export interface AppUpdate {
  id: string;
  headline: string;
  subtitle: string;
  emoji: string;
  features: UpdateFeature[];
  ctaLabel: string;
  ctaHref: string;
  dismissLabel?: string;
}

const UPDATES: AppUpdate[] = [
  {
    id: "2026-03-16-stitching-markup",
    headline: "Your New Stitching Studio",
    subtitle: "Crafted by Miss Daisy with love — everything you need, all in one place.",
    emoji: "✨",
    features: [
      { icon: "⏱️", text: "Stitching Mode — timer, stitch counter, daily goals & full R-XP-style stats" },
      { icon: "📐", text: "Pattern Markup — mark stitches on your chart as you go" },
      { icon: "📸", text: "Progress photos — snap a pic each session to see your work evolve" },
      { icon: "📦", text: "Import & Export — bring data from PatternKeeper, R-XP, or Saga" },
      { icon: "🐾", text: "Add pets anytime from your Profile" },
    ],
    ctaLabel: "Try It Now ✿",
    ctaHref: "/stitching",
    dismissLabel: "Maybe later",
  },
];

// ── localStorage ─────────────────────────────────────────────

const STORAGE_KEY = "ss_whats_new_seen";

function getSeenUpdates(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
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
  onDismiss?: () => void;
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
      const t1 = setTimeout(() => setVisible(true), 400);
      const t2 = setTimeout(() => setAnimateIn(true), 460);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      onDismiss?.();
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    if (update) markSeen(update.id);
    setAnimateIn(false);
    setTimeout(() => { setVisible(false); onDismiss?.(); }, 320);
  }, [update, onDismiss]);

  if (!visible || !update) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ opacity: animateIn ? 1 : 0, transition: "opacity 0.3s ease" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3A2418]/50 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[380px] rounded-3xl bg-white overflow-hidden"
        style={{
          maxHeight: "min(92vh, 560px)",
          transform: animateIn ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 24px 48px rgba(58, 36, 24, 0.2), 0 0 0 1px rgba(58, 36, 24, 0.05)",
        }}
      >
        <div className="flex flex-col max-h-[min(92vh,560px)]">
          {/* ── Header ─────────────────────────────────── */}
          <div
            className="relative px-6 pt-6 pb-5 flex-shrink-0"
            style={{ background: "linear-gradient(155deg, #FDF4F1 0%, #FAF6F0 50%, #EBF2EC 100%)" }}
          >
            {/* Blob accents */}
            <div className="absolute top-[-20px] right-[-10px] w-28 h-28 rounded-full opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #F0C8BB, transparent 70%)" }} />

            <div className="relative flex flex-col items-center text-center">
              {/* Pill */}
              <div
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full mb-3"
                style={{ background: "linear-gradient(135deg, #B36050, #CA8070)" }}
              >
                <span className="font-nunito text-[10px] font-bold text-white uppercase tracking-wider">
                  ✦ New ✦
                </span>
              </div>

              {/* Emoji */}
              <div className="text-4xl mb-2" style={{ animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both" }}>
                {update.emoji}
              </div>

              {/* Headline */}
              <h2 className="font-playfair text-[22px] font-bold text-[#3A2418] leading-tight">
                {update.headline}
              </h2>

              {/* Subtitle */}
              <p className="font-nunito text-[13px] text-[#5F7A63] mt-1.5 leading-snug px-2">
                {update.subtitle}
              </p>
            </div>
          </div>

          {/* ── Features (scrollable) ──────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="flex flex-col gap-2">
              {update.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl bg-[#FAF6F0] px-3 py-2.5"
                  style={{ animation: `fadeSlideUp 0.35s ease-out ${0.2 + i * 0.06}s both` }}
                >
                  <span className="text-base flex-shrink-0">{f.icon}</span>
                  <p className="font-nunito text-[12.5px] text-[#3A2418] leading-snug">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ────────────────────────────────────── */}
          <div className="flex-shrink-0 px-5 pb-5 pt-2 flex flex-col gap-2" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}>
            <Link
              href={update.ctaHref}
              onClick={dismiss}
              className="block w-full py-3 rounded-full text-center font-nunito font-bold text-[14px] text-white active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(135deg, #CA8070, #B36050)",
                boxShadow: "0 4px 16px rgba(179, 96, 80, 0.3)",
              }}
            >
              {update.ctaLabel}
            </Link>
            <button
              onClick={dismiss}
              className="w-full py-2 text-center font-nunito font-semibold text-[12px] text-[#9A8578] active:scale-[0.97]"
            >
              {update.dismissLabel ?? "Dismiss"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
