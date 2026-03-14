"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dog } from "@/types";

interface GreetingProfile {
  display_name: string;
  dogs: Dog[];
}

// ── Greeting copy pools ──────────────────────────────────────

const MESSAGES = {
  morning: [
    "Your threads are ready — time to make something magical!",
    "A brand-new day of beautiful stitches awaits you.",
    "Every stitch you make is a little piece of forever. ✿",
    "The best projects start with a happy heart and a fresh needle.",
    "Today's the perfect morning to make real progress on something you love.",
    "Pick up those needles and let the magic begin!",
  ],
  afternoon: [
    "The afternoon light is perfect for your finest work.",
    "Pick up those needles — your patterns are patiently waiting.",
    "A little progress today makes a masterpiece tomorrow.",
    "Half the day is still yours. Make it beautiful.",
    "Your stash isn't going to stitch itself — let's go!",
  ],
  evening: [
    "Wind down with a few peaceful stitches tonight.",
    "Evening stitching — the very best kind of relaxing.",
    "Your needle and thread are the perfect end to a good day.",
    "Candle on, pattern out, world off. Let's stitch!",
    "A few more stitches before bed? We absolutely won't judge.",
  ],
  night: [
    "A night owl stitcher — our absolute favourite kind!",
    "Late-night stitching: where the real magic happens.",
    "The quiet hours are perfect for your most detailed work.",
    "The house is asleep. Your needle is awake. Let's go.",
  ],
};

const TIME_ICONS: Record<string, string> = {
  morning: "☀️",
  afternoon: "🌸",
  evening: "🌙",
  night: "✨",
};

function getTimeSlot(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function getDayMessage(slot: "morning" | "afternoon" | "evening" | "night") {
  const pool = MESSAGES[slot];
  const day = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return pool[day % pool.length];
}

// ── Dog cell ─────────────────────────────────────────────────

function DogCell({ dog, index }: { dog: Dog; index: number }) {
  const delay = 0.25 + index * 0.12; // stagger: first pops at 250ms
  const isWiggler = index % 2 !== 0;
  const loopDelay = delay + 0.55;
  const loopAnim = isWiggler
    ? `wiggle 2.0s ease-in-out ${loopDelay}s infinite`
    : `float 2.4s ease-in-out ${loopDelay}s infinite`;

  return (
    <div
      className="flex flex-col items-center gap-1 select-none"
      style={{
        animation: `popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both, ${loopAnim}`,
      }}
    >
      <span className="text-4xl leading-none">{dog.emoji}</span>
      <span className="text-[11px] font-bold font-nunito text-[#6B544D] text-center leading-tight max-w-[52px] truncate">
        {dog.name}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

interface DailyGreetingProps {
  onDismiss?: () => void;
  onSkipped?: () => void;
}

export function DailyGreeting({ onDismiss, onSkipped }: DailyGreetingProps) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [profile, setProfile] = useState<GreetingProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      const today = new Date().toDateString();
      if (localStorage.getItem("ss_greeted") === today) {
        // Greeting already seen today — notify parent immediately
        onSkipped?.();
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        onSkipped?.();
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name, dogs")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          display_name: data.display_name || "Friend",
          dogs: Array.isArray(data.dogs) ? data.dogs : [],
        });
        setVisible(true);
        setTimeout(() => setAnimateIn(true), 60);
      } else {
        onSkipped?.();
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    localStorage.setItem("ss_greeted", new Date().toDateString());
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 280);
  };

  if (!visible || !profile) return null;

  const slot = getTimeSlot();
  const timeIcon = TIME_ICONS[slot];
  const message = getDayMessage(slot);
  const greeting =
    slot === "morning"
      ? "Good morning"
      : slot === "afternoon"
      ? "Good afternoon"
      : slot === "evening"
      ? "Good evening"
      : "Hello, night owl";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 transition-opacity duration-300"
      style={{
        opacity: animateIn ? 1 : 0,
        background:
          "linear-gradient(155deg, #FDF4F1 0%, #FAF6F0 45%, #EBF2EC 100%)",
      }}
      onClick={dismiss}
    >
      {/* Decorative background blobs */}
      <div
        className="absolute top-[-60px] right-[-40px] w-64 h-64 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F0C8BB, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-40px] left-[-30px] w-56 h-56 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C0D4C2, transparent 70%)" }}
      />

      <div
        className="relative flex flex-col items-center gap-6 w-full max-w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Time icon */}
        <div
          className="text-5xl"
          style={{ animation: "float 3.2s ease-in-out 0.1s infinite" }}
        >
          {timeIcon}
        </div>

        {/* Greeting text */}
        <div
          className="text-center"
          style={{ animation: "fadeSlideUp 0.55s ease-out 0.1s both" }}
        >
          <p className="font-nunito text-sm font-semibold text-[#6B544D] uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="font-playfair text-4xl font-bold text-[#3A2418] leading-tight">
            {profile.display_name}!
          </h1>
          <p className="font-nunito text-[15px] text-[#5F7A63] mt-3 leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Dogs */}
        {profile.dogs.length > 0 && (
          <div
            className="w-full"
            style={{ animation: "fadeSlideUp 0.55s ease-out 0.22s both" }}
          >
            <p className="text-center font-nunito text-[11px] font-bold text-[#9A8578] uppercase tracking-widest mb-4">
              Your fur babies are cheering you on 🐾
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {profile.dogs.map((dog, i) => (
                <DogCell key={dog.id || i} dog={dog} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-16 h-px bg-[#E4D6C8]" />

        {/* CTA button */}
        <div
          className="w-full"
          style={{ animation: "fadeSlideUp 0.55s ease-out 0.38s both" }}
        >
          <button
            onClick={dismiss}
            className="w-full py-4 rounded-full font-nunito font-bold text-[16px] text-white transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #CA8070, #B36050)",
              boxShadow: "0 6px 24px rgba(179, 96, 80, 0.38)",
            }}
          >
            🪡 Let&apos;s stitch!
          </button>
          <p className="text-center font-nunito text-[11px] text-[#C4AFA6] mt-3">
            tap anywhere to skip
          </p>
        </div>
      </div>
    </div>
  );
}
