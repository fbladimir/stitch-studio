"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTRO_KEY = "ss_roku_intro_seen";

// ── Roku SVG Avatar — Aussie Doodle, golden/brown ─────────────

function RokuAvatar({
  size = 180,
  bounce = false,
  className = "",
}: {
  size?: number;
  bounce?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        animation: bounce
          ? "rokoFloat 2.4s ease-in-out infinite"
          : "rokoPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="roku-bg" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#E8C060" />
            <stop offset="100%" stopColor="#B87020" />
          </radialGradient>
          <radialGradient id="roku-fur" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#D4923A" />
            <stop offset="100%" stopColor="#8A5215" />
          </radialGradient>
          <radialGradient id="roku-snout" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#E0B878" />
            <stop offset="100%" stopColor="#C4923C" />
          </radialGradient>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="100" fill="url(#roku-bg)" />

        {/* Soft inner glow */}
        <circle cx="100" cy="80" r="70" fill="rgba(255,220,140,0.18)" />

        {/* Left ear (floppy, behind head) */}
        <ellipse cx="43" cy="90" rx="26" ry="40" fill="#6B3C0E" transform="rotate(-20 43 90)" />
        <ellipse cx="43" cy="92" rx="17" ry="28" fill="#A86020" transform="rotate(-20 43 92)" />
        {/* Left ear fur lines */}
        <path d="M 30 76 Q 36 88 32 100" stroke="#7A4A10" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M 36 70 Q 42 84 38 98" stroke="#7A4A10" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Right ear (floppy, behind head) */}
        <ellipse cx="157" cy="90" rx="26" ry="40" fill="#6B3C0E" transform="rotate(20 157 90)" />
        <ellipse cx="157" cy="92" rx="17" ry="28" fill="#A86020" transform="rotate(20 157 92)" />
        {/* Right ear fur lines */}
        <path d="M 170 76 Q 164 88 168 100" stroke="#7A4A10" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M 164 70 Q 158 84 162 98" stroke="#7A4A10" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Head */}
        <circle cx="100" cy="112" r="70" fill="url(#roku-fur)" />

        {/* Fluffy wavy fur on top of head (aussie doodle curls) */}
        <path
          d="M 48 90 Q 56 72 68 84 Q 76 64 88 78 Q 96 60 104 78 Q 112 64 124 80 Q 134 66 144 84 Q 156 72 160 90"
          fill="none"
          stroke="#6B3C0E"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 54 82 Q 64 62 76 76 Q 86 56 98 72 Q 110 54 122 72 Q 134 60 144 80"
          fill="none"
          stroke="#6B3C0E"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Forehead fur shape (dark base) */}
        <path
          d="M 62 76 Q 76 56 100 68 Q 124 54 138 76 Q 120 70 100 74 Q 80 70 62 76 Z"
          fill="#8A5215"
          opacity="0.6"
        />

        {/* Left eye white */}
        <ellipse cx="78" cy="106" rx="15" ry="16" fill="white" />
        {/* Right eye white */}
        <ellipse cx="122" cy="106" rx="15" ry="16" fill="white" />

        {/* Left pupil */}
        <circle cx="80" cy="107" r="11" fill="#120A04" />
        {/* Right pupil */}
        <circle cx="124" cy="107" r="11" fill="#120A04" />

        {/* Left iris */}
        <circle cx="80" cy="107" r="8" fill="#3C1E08" />
        {/* Right iris */}
        <circle cx="124" cy="107" r="8" fill="#3C1E08" />

        {/* Eye shine left */}
        <circle cx="84" cy="103" r="4" fill="white" opacity="0.92" />
        <circle cx="78" cy="111" r="2" fill="white" opacity="0.5" />
        {/* Eye shine right */}
        <circle cx="128" cy="103" r="4" fill="white" opacity="0.92" />
        <circle cx="122" cy="111" r="2" fill="white" opacity="0.5" />

        {/* Snout area */}
        <ellipse cx="100" cy="130" rx="24" ry="19" fill="url(#roku-snout)" />

        {/* Nose */}
        <ellipse cx="100" cy="122" rx="12" ry="8.5" fill="#120A04" />
        {/* Nose highlight */}
        <ellipse cx="96" cy="119" rx="4" ry="3" fill="rgba(255,255,255,0.38)" />
        {/* Nose septum line */}
        <line x1="100" y1="122" x2="100" y2="128" stroke="#0A0604" strokeWidth="1.5" />

        {/* Smile */}
        <path
          d="M 86 132 Q 100 146 114 132"
          stroke="#120A04"
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Happy tongue */}
        <ellipse cx="100" cy="145" rx="11" ry="10" fill="#E07080" />
        <line x1="100" y1="136" x2="100" y2="145" stroke="#C04060" strokeWidth="2.2" />
        {/* Tongue highlight */}
        <ellipse cx="96" cy="142" rx="3.5" ry="3" fill="rgba(255,255,255,0.25)" />

        {/* Cheek blush */}
        <circle cx="66" cy="124" r="15" fill="#E09070" opacity="0.28" />
        <circle cx="134" cy="124" r="15" fill="#E09070" opacity="0.28" />

        {/* Little paw at bottom of circle evoking the dog vibe */}
        <circle cx="88" cy="178" r="7" fill="#D4923A" opacity="0.8" />
        <circle cx="100" cy="182" r="8" fill="#D4923A" opacity="0.8" />
        <circle cx="112" cy="178" r="7" fill="#D4923A" opacity="0.8" />
        <circle cx="94" cy="172" r="5.5" fill="#C07828" opacity="0.7" />
        <circle cx="106" cy="172" r="5.5" fill="#C07828" opacity="0.7" />
      </svg>
    </div>
  );
}

// ── Slides data ───────────────────────────────────────────────

interface Slide {
  speech: string;
  title: string;
  body: string;
  cta: string;
  emoji?: string;
}

const SLIDES: Slide[] = [
  {
    speech: "Woof! 🐾",
    title: "Hi, I'm Roku!",
    body: "Your favorite aussie doodle — and your personal guide to Stitch Studio.",
    cta: "Nice to meet you, Roku! →",
  },
  {
    speech: "My dad made something really special...",
    title: "Your crafting universe, organized",
    body: "Every pattern, thread, fabric, and kit — in one beautiful place. No more forgetting what you own!",
    cta: "Ooh, tell me more! →",
    emoji: "✿",
  },
  {
    speech: "Just snap a photo... Arf! ✨",
    title: "AI does the typing for you",
    body: "Photograph your pattern cover and AI reads the name, designer, size, and threads — all filled in automatically.",
    cta: "That's amazing! →",
    emoji: "📸",
  },
  {
    speech: "I'll be cheering you on every day! Arf arf! 🐾",
    title: "Ready to begin?",
    body: "Create your account once, then just log in on any device next time. Easy as pie!",
    cta: "Begin my journey →",
    emoji: "🌸",
  },
];

// ── Feature pills for slide 2 ─────────────────────────────────

const FEATURES = [
  { icon: "📸", label: "Scan patterns" },
  { icon: "🧵", label: "Thread stash" },
  { icon: "🛍️", label: "In-store helper" },
  { icon: "🤖", label: "AI advisor" },
];

// ── Main page ─────────────────────────────────────────────────

export default function IntroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  // If already authenticated, go to dashboard
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.replace("/dashboard");
    };
    check();
  }, [router]);

  const advance = useCallback(() => {
    if (step < SLIDES.length - 1) {
      setAnimKey((k) => k + 1);
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(INTRO_KEY, "true");
      router.push("/auth?tab=signup");
    }
  }, [step, router]);

  function skip() {
    localStorage.setItem(INTRO_KEY, "true");
    router.push("/welcome");
  }

  function goExistingAccount() {
    localStorage.setItem(INTRO_KEY, "true");
    router.push("/auth?tab=signin");
  }

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col overflow-hidden relative select-none">
      <style>{`
        @keyframes rokoPopIn {
          from { opacity: 0; transform: scale(0.5) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rokoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes introSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes speechPop {
          0%   { opacity: 0; transform: scale(0.8) translateY(8px); }
          70%  { transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>

      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#F0C8BB] opacity-30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#EBF2EC] opacity-35 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FBF0E8] opacity-50 blur-3xl" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #E4D6C8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.3,
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-4">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                backgroundColor: i === step ? "#B36050" : "#E4D6C8",
              }}
            />
          ))}
        </div>
        <button
          onClick={skip}
          className="font-nunito text-[13px] font-semibold text-[#B6A090] active:opacity-60 transition-opacity px-2 py-1"
        >
          Skip
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-8 pb-12">

        {/* Dog + speech bubble */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 pt-4">

          {/* Speech bubble */}
          <div
            key={`speech-${animKey}`}
            className="relative bg-white rounded-2xl px-5 py-3 border border-[#E4D6C8] max-w-[280px]"
            style={{
              boxShadow: "0 4px 20px rgba(58,36,24,0.08)",
              animation: "speechPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <p className="font-nunito font-bold text-[15px] text-[#3A2418] text-center leading-snug">
              {slide.speech}
            </p>
            {/* Tail pointing down toward Roku */}
            <div
              className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-[#E4D6C8]"
              style={{ transform: "translateX(-50%) rotate(45deg)" }}
            />
          </div>

          {/* Roku Avatar */}
          <RokuAvatar key={`roku-${animKey}`} size={200} bounce={true} />

          {/* Slide content */}
          <div
            key={`content-${animKey}`}
            className="w-full max-w-[320px] text-center"
            style={{ animation: "introSlideUp 0.5s ease-out 0.15s both" }}
          >
            {slide.emoji && (
              <div className="text-4xl mb-3">{slide.emoji}</div>
            )}
            <h1 className="font-playfair text-[26px] font-bold text-[#3A2418] leading-tight mb-3">
              {slide.title}
            </h1>
            <p className="font-nunito text-[15px] text-[#896E66] leading-relaxed">
              {slide.body}
            </p>

            {/* Feature pills on slide 2 */}
            {step === 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {FEATURES.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E4D6C8] font-nunito font-semibold text-[13px] text-[#3A2418]"
                    style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.06)" }}
                  >
                    {f.icon} {f.label}
                  </span>
                ))}
              </div>
            )}

            {/* AI demo visual on slide 3 */}
            {step === 2 && (
              <div
                className="mt-5 flex items-center justify-center gap-3"
                style={{ animation: "introSlideUp 0.5s ease-out 0.3s both" }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F5EEE8] border border-[#E4D6C8] flex items-center justify-center text-2xl">
                  📷
                </div>
                <div className="flex gap-1">
                  {[0.1, 0.25, 0.4].map((d, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#B36050]"
                      style={{ animation: `softPulse 1.2s ease-in-out ${d}s infinite` }}
                    />
                  ))}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#FDF4F1] border border-[#F0C8BB] flex items-center justify-center text-2xl">
                  ✨
                </div>
                <div className="flex gap-1">
                  {[0.1, 0.25, 0.4].map((d, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#B36050]"
                      style={{ animation: `softPulse 1.2s ease-in-out ${d}s infinite` }}
                    />
                  ))}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#EBF2EC] border border-[#C0D4C2] flex items-center justify-center text-2xl">
                  📋
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom buttons */}
        <div
          className="w-full max-w-[340px] space-y-3"
          key={`btns-${animKey}`}
          style={{ animation: "introSlideUp 0.5s ease-out 0.3s both" }}
        >
          <button
            onClick={advance}
            className="w-full h-14 rounded-full text-white font-nunito font-bold text-[16px] active:scale-[0.97] transition-transform"
            style={{
              background: "linear-gradient(135deg, #CA8070, #B36050)",
              boxShadow: "0 6px 24px rgba(179,96,80,0.35)",
            }}
          >
            {slide.cta}
          </button>

          {isLast && (
            <button
              onClick={goExistingAccount}
              className="w-full h-12 rounded-full bg-white border border-[#E4D6C8] font-nunito font-semibold text-[14px] text-[#3A2418] active:scale-[0.97] transition-transform"
            >
              I already have an account
            </button>
          )}

          {!isLast && (
            <p className="text-center font-nunito text-[12px] text-[#C4AFA6]">
              Roku is here to show you around 🐾
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
