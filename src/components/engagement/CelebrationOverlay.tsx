"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import type { Dog } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ── Confetti particle ───────────────────────────────────────

const CONFETTI_COLORS = ["#B36050", "#5F7A63", "#AE7C2A", "#FDF4F1", "#F0C8BB", "#CA8070"];

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 1.5;
  const duration = 2.5 + Math.random() * 2;
  const size = 6 + Math.random() * 8;
  const shape = index % 3 === 0 ? "rounded-full" : index % 3 === 1 ? "rounded-sm" : "";

  return (
    <div
      className={`absolute top-0 ${shape} pointer-events-none`}
      style={{
        left: `${left}%`,
        width: size,
        height: size * (index % 2 === 0 ? 1 : 0.6),
        backgroundColor: color,
        animation: `confettiFall ${duration}s ease-in ${delay}s both`,
      }}
    />
  );
}

// ── Dog parade (reused from DailyGreeting pattern) ──────────

function DogParade({ dogs }: { dogs: Dog[] }) {
  if (dogs.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {dogs.map((dog, i) => {
        const delay = 0.3 + i * 0.12;
        const isWiggler = i % 2 !== 0;
        const loopDelay = delay + 0.55;
        const loopAnim = isWiggler
          ? `wiggle 2.0s ease-in-out ${loopDelay}s infinite`
          : `float 2.4s ease-in-out ${loopDelay}s infinite`;
        return (
          <div
            key={dog.id || i}
            className="flex flex-col items-center gap-0.5 select-none"
            style={{
              animation: `popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both, ${loopAnim}`,
            }}
          >
            <span className="text-3xl leading-none">{dog.emoji}</span>
            <span className="text-[10px] font-bold font-nunito text-[#896E66] truncate max-w-[48px]">
              {dog.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main overlay ────────────────────────────────────────────

export function CelebrationOverlay() {
  const queue = useAppStore((s) => s.celebrationQueue);
  const popCelebration = useAppStore((s) => s.popCelebration);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [animateIn, setAnimateIn] = useState(false);

  const celebration = queue[0] ?? null;
  const isFinish = celebration?.type === "pattern_finished";

  // Load dogs for parade
  useEffect(() => {
    if (!celebration) return;
    const loadDogs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("dogs")
        .eq("id", user.id)
        .single();
      if (data?.dogs) setDogs(Array.isArray(data.dogs) ? data.dogs : []);
    };
    loadDogs();
  }, [celebration]);

  useEffect(() => {
    if (celebration) {
      setTimeout(() => setAnimateIn(true), 60);
    }
  }, [celebration]);

  const dismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      popCelebration();
    }, 300);
  }, [popCelebration]);

  // Auto-dismiss non-finish celebrations after 4s
  useEffect(() => {
    if (!celebration || isFinish) return;
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [celebration, isFinish, dismiss]);

  if (!celebration) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-5 transition-opacity duration-300"
      style={{
        opacity: animateIn ? 1 : 0,
        background: "linear-gradient(155deg, #FDF4F1 0%, #FAF6F0 45%, #EBF2EC 100%)",
      }}
      onClick={!isFinish ? dismiss : undefined}
    >
      {/* Confetti */}
      {(isFinish || celebration.type === "streak_milestone") && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="relative flex flex-col items-center gap-4 w-full max-w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge icon or main visual */}
        {celebration.badgeIcon && (
          <div
            className="text-6xl"
            style={{ animation: "badgePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both" }}
          >
            {celebration.badgeIcon}
          </div>
        )}

        {/* Cover photo for finished patterns */}
        {isFinish && celebration.coverPhotoUrl && (
          <div
            className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={celebration.coverPhotoUrl}
              alt={celebration.patternName ?? ""}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <div
          className="text-center"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
        >
          <h1 className="font-playfair text-3xl font-bold text-[#3A2418]">
            {celebration.type === "pattern_finished" ? "✿ " : ""}
            {celebration.title}
            {celebration.type === "pattern_finished" ? " ✿" : ""}
          </h1>
          {celebration.patternName && (
            <p className="font-nunito text-[15px] text-[#B36050] font-semibold mt-1">
              {celebration.patternName}
            </p>
          )}
          <p className="font-nunito text-[15px] text-[#5F7A63] mt-2 leading-relaxed">
            {celebration.subtitle}
          </p>
        </div>

        {/* Dog line */}
        {celebration.dogLine && (
          <p
            className="font-nunito text-[13px] text-[#896E66] italic"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
          >
            🐾 {celebration.dogLine}
          </p>
        )}

        {/* Stats for finished */}
        {celebration.stats && celebration.stats.length > 0 && (
          <div
            className="flex gap-4 mt-2"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.35s both" }}
          >
            {celebration.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-playfair text-xl font-bold text-[#B36050]">{s.value}</p>
                <p className="font-nunito text-[10px] text-[#896E66] uppercase tracking-wide font-semibold">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Dog parade for finish celebrations */}
        {isFinish && dogs.length > 0 && (
          <div style={{ animation: "fadeSlideUp 0.5s ease-out 0.4s both" }}>
            <DogParade dogs={dogs} />
          </div>
        )}

        {/* Level title */}
        {celebration.levelTitle && (
          <div
            className="mt-2 px-4 py-2 rounded-full bg-[#FBF5E8] border border-[#E8D5A0]"
            style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
          >
            <p className="font-nunito text-[13px] font-bold text-[#AE7C2A]">
              {celebration.levelTitle}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="w-16 h-px bg-[#E4D6C8] mt-2" />

        {/* CTA */}
        <div
          className="w-full"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.45s both" }}
        >
          <button
            onClick={dismiss}
            className="w-full py-3.5 rounded-full font-nunito font-bold text-[15px] text-white transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #CA8070, #B36050)",
              boxShadow: "0 6px 24px rgba(179, 96, 80, 0.38)",
            }}
          >
            {isFinish ? "Back to My Collection" : "Keep Going!"}
          </button>
          {!isFinish && (
            <p className="text-center font-nunito text-[11px] text-[#C4AFA6] mt-2">
              tap anywhere to dismiss
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
