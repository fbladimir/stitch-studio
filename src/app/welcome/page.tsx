"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INTRO_KEY = "ss_roku_intro_seen";

export default function WelcomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "content" | "ready">("intro");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // First-time visitors get redirected to the Roku intro
    if (!localStorage.getItem(INTRO_KEY)) {
      router.replace("/intro");
      return;
    }
    setChecked(true);
    // Sequence: show logo first, then content fades in
    const t1 = setTimeout(() => setPhase("content"), 400);
    const t2 = setTimeout(() => setPhase("ready"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  // Prevent flash before redirect
  if (!checked) return <div className="min-h-screen bg-[#FAF6F0]" />;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col overflow-hidden relative">

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-right soft circle */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#F0C8BB] opacity-30 blur-3xl" />
        {/* Bottom-left soft circle */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#EBF2EC] opacity-40 blur-3xl" />
        {/* Center warm glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FDF4F1] opacity-60 blur-3xl" />
      </div>

      {/* Top color bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#B36050] via-[#CA8070] to-[#F0C8BB] relative z-10" />

      {/* Decorative cross stitch grid (subtle) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #E4D6C8 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        opacity: 0.35,
      }} />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-8 py-16">

        {/* Top section: logo + name */}
        <div className="flex-1 flex flex-col items-center justify-center gap-0">

          {/* Icon with ring animation */}
          <div
            className="relative mb-8"
            style={{
              opacity: phase !== "intro" ? 1 : 0,
              transform: phase !== "intro" ? "scale(1) translateY(0)" : "scale(0.7) translateY(16px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full bg-[#F0C8BB] opacity-40 blur-md scale-125" />
            {/* Inner ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[#F0C8BB] scale-110" />
            {/* Icon box */}
            <div className="relative w-28 h-28 rounded-3xl bg-[#B36050] flex items-center justify-center shadow-xl">
              <span className="text-6xl" role="img" aria-label="needle and thread">🪡</span>
            </div>
          </div>

          {/* App name */}
          <div
            style={{
              opacity: phase !== "intro" ? 1 : 0,
              transform: phase !== "intro" ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >
            <h1 className="font-playfair text-5xl font-bold text-[#3A2418] text-center tracking-tight leading-tight">
              Stitch<br />Studio
            </h1>
          </div>

          {/* Decorative divider */}
          <div
            className="flex items-center gap-3 my-6"
            style={{
              opacity: phase === "ready" ? 1 : 0,
              transition: "opacity 0.6s ease 0.1s",
            }}
          >
            <div className="h-px w-12 bg-[#E4D6C8]" />
            <span className="text-[#C4A898] text-lg">✿</span>
            <div className="h-px w-12 bg-[#E4D6C8]" />
          </div>

          {/* Tagline */}
          <div
            style={{
              opacity: phase === "ready" ? 1 : 0,
              transform: phase === "ready" ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
            }}
          >
            <p className="text-[#6B544D] text-lg text-center leading-relaxed max-w-xs">
              Your complete cross stitch companion — patterns, threads, and kits all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div
            className="flex flex-wrap justify-center gap-2 mt-6 max-w-xs"
            style={{
              opacity: phase === "ready" ? 1 : 0,
              transform: phase === "ready" ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
            }}
          >
            {["📸 AI Pattern Scanning", "🧵 Thread Inventory", "🛍️ In-Store Mode"].map((pill) => (
              <span
                key={pill}
                className="px-3 py-1.5 rounded-full bg-white border border-[#E4D6C8] text-xs font-semibold text-[#6B544D] shadow-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom section: CTAs */}
        <div
          className="w-full max-w-sm space-y-3"
          style={{
            opacity: phase === "ready" ? 1 : 0,
            transform: phase === "ready" ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease 0.45s, transform 0.6s ease 0.45s",
          }}
        >
          <button
            onClick={() => router.push("/auth?tab=signup")}
            className="w-full h-14 rounded-full bg-[#B36050] text-white text-base font-semibold shadow-lg active:scale-[0.98] transition-transform"
            style={{ boxShadow: "0 4px 20px rgba(179,96,80,0.35)" }}
          >
            Begin your journey →
          </button>

          <button
            onClick={() => router.push("/auth?tab=signin")}
            className="w-full h-14 rounded-full bg-white border border-[#E4D6C8] text-[#3A2418] text-base font-semibold active:scale-[0.98] transition-transform"
          >
            I already have an account
          </button>

          <p className="text-center text-xs text-[#C4A898] pt-1">
            Made with love for your stitching journey ✿
          </p>
        </div>
      </div>
    </div>
  );
}
