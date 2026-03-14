"use client";

import { useEffect, useState, useCallback } from "react";
import { useTutorial } from "@/hooks/useTutorial";
import { useAppStore } from "@/store/appStore";

// ── Small Roku Avatar (inline SVG) ─────────────────────────────

function RokuSmall({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="rk-bg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E8C060" />
          <stop offset="100%" stopColor="#B87020" />
        </radialGradient>
        <radialGradient id="rk-fur" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D4923A" />
          <stop offset="100%" stopColor="#8A5215" />
        </radialGradient>
        <radialGradient id="rk-snout" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#E0B878" />
          <stop offset="100%" stopColor="#C4923C" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#rk-bg)" />
      <circle cx="100" cy="80" r="70" fill="rgba(255,220,140,0.18)" />
      <ellipse cx="43" cy="90" rx="26" ry="40" fill="#6B3C0E" transform="rotate(-20 43 90)" />
      <ellipse cx="43" cy="92" rx="17" ry="28" fill="#A86020" transform="rotate(-20 43 92)" />
      <ellipse cx="157" cy="90" rx="26" ry="40" fill="#6B3C0E" transform="rotate(20 157 90)" />
      <ellipse cx="157" cy="92" rx="17" ry="28" fill="#A86020" transform="rotate(20 157 92)" />
      <circle cx="100" cy="112" r="70" fill="url(#rk-fur)" />
      <path d="M 48 90 Q 56 72 68 84 Q 76 64 88 78 Q 96 60 104 78 Q 112 64 124 80 Q 134 66 144 84 Q 156 72 160 90" fill="none" stroke="#6B3C0E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 62 76 Q 76 56 100 68 Q 124 54 138 76 Q 120 70 100 74 Q 80 70 62 76 Z" fill="#8A5215" opacity="0.6" />
      <ellipse cx="78" cy="106" rx="15" ry="16" fill="white" />
      <ellipse cx="122" cy="106" rx="15" ry="16" fill="white" />
      <circle cx="80" cy="107" r="11" fill="#120A04" />
      <circle cx="124" cy="107" r="11" fill="#120A04" />
      <circle cx="80" cy="107" r="8" fill="#3C1E08" />
      <circle cx="124" cy="107" r="8" fill="#3C1E08" />
      <circle cx="84" cy="103" r="4" fill="white" opacity="0.92" />
      <circle cx="128" cy="103" r="4" fill="white" opacity="0.92" />
      <ellipse cx="100" cy="130" rx="24" ry="19" fill="url(#rk-snout)" />
      <ellipse cx="100" cy="122" rx="12" ry="8.5" fill="#120A04" />
      <ellipse cx="96" cy="119" rx="4" ry="3" fill="rgba(255,255,255,0.38)" />
      <path d="M 86 132 Q 100 146 114 132" stroke="#120A04" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="145" rx="11" ry="10" fill="#E07080" />
      <line x1="100" y1="136" x2="100" y2="145" stroke="#C04060" strokeWidth="2.2" />
      <circle cx="66" cy="124" r="15" fill="#E09070" opacity="0.28" />
      <circle cx="134" cy="124" r="15" fill="#E09070" opacity="0.28" />
      <circle cx="88" cy="178" r="7" fill="#D4923A" opacity="0.8" />
      <circle cx="100" cy="182" r="8" fill="#D4923A" opacity="0.8" />
      <circle cx="112" cy="178" r="7" fill="#D4923A" opacity="0.8" />
    </svg>
  );
}

// ── Rect type ───────────────────────────────────────────────────

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10;
const GAP = 14;

// ── Main overlay component ──────────────────────────────────────

export function TutorialOverlay() {
  const isTutorialActive = useAppStore((s) => s.isTutorialActive);
  const tutorialStep = useAppStore((s) => s.tutorialStep);
  const { currentStep, totalSteps, steps, nextStep, skipTutorial } =
    useTutorial();

  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [vpSize, setVpSize] = useState({ w: 0, h: 0 });

  // Measure viewport + target
  const measure = useCallback(() => {
    setVpSize({ w: window.innerWidth, h: window.innerHeight });

    if (!currentStep?.targetId) {
      setRect(null);
      return;
    }

    const el = document.querySelector(
      `[data-tutorial-id="${currentStep.targetId}"]`
    );
    if (!el) {
      setRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
  }, [currentStep]);

  // Re-measure on step change, resize, scroll
  useEffect(() => {
    if (!isTutorialActive) return;
    setAnimKey((k) => k + 1);

    const timer = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isTutorialActive, tutorialStep, measure]);

  // Scroll non-fixed targets into view
  useEffect(() => {
    if (!isTutorialActive || !currentStep?.targetId) return;
    const el = document.querySelector(
      `[data-tutorial-id="${currentStep.targetId}"]`
    );
    if (!el) return;

    // Don't scroll if element is in a fixed container (nav)
    const closest = el.closest("nav");
    if (closest) {
      const style = window.getComputedStyle(closest);
      if (style.position === "fixed") return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isTutorialActive, currentStep, tutorialStep]);

  if (!isTutorialActive || !currentStep) return null;

  const isLastStep = tutorialStep === totalSteps - 1;
  const isCenterStep = currentStep.position === "center" || !rect;

  // Is the target a fixed bottom element (bottom nav)?
  const isBottomNavTarget = currentStep.targetId === "bottom-nav";

  // ── Tooltip position ──────────────────────────────────────────

  const tooltipW = Math.min(320, vpSize.w - 32);

  let tooltipStyle: React.CSSProperties;

  if (isCenterStep) {
    // Center step: use flexbox centering (no transform needed)
    tooltipStyle = {
      width: tooltipW,
    };
  } else if (isBottomNavTarget && rect) {
    // Bottom nav: place tooltip well above the nav bar, centered horizontally
    tooltipStyle = {
      position: "fixed",
      bottom: vpSize.h - rect.top + GAP,
      left: Math.max(16, (vpSize.w - tooltipW) / 2),
      width: tooltipW,
    };
  } else if (rect) {
    const tooltipLeft = Math.max(
      16,
      Math.min(
        rect.left + rect.width / 2 - tooltipW / 2,
        vpSize.w - tooltipW - 16
      )
    );
    // Estimated tooltip height
    const tooltipH = 170;
    // Prefer placing above for bottom items, below for top content
    const spaceAbove = rect.top - GAP;
    const spaceBelow = vpSize.h - (rect.top + rect.height) - GAP;
    const placeAbove =
      currentStep.position === "top" || spaceAbove > spaceBelow;

    if (placeAbove && spaceAbove >= tooltipH) {
      tooltipStyle = {
        position: "fixed",
        bottom: vpSize.h - rect.top + GAP,
        left: tooltipLeft,
        width: tooltipW,
      };
    } else {
      tooltipStyle = {
        position: "fixed",
        top: rect.top + rect.height + GAP,
        left: tooltipLeft,
        width: tooltipW,
      };
    }
  } else {
    tooltipStyle = { width: tooltipW };
  }

  return (
    <div className="fixed inset-0 z-[300]" style={{ pointerEvents: "none" }}>
      {/* SVG-based backdrop with spotlight cutout — works on all browsers including iOS Safari */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto", zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="tutorial-spotlight">
            {/* White = visible (backdrop shows), black = hidden (cutout) */}
            <rect width="100%" height="100%" fill="white" />
            {rect && !isCenterStep && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(58, 36, 24, 0.6)"
          mask="url(#tutorial-spotlight)"
        />
      </svg>

      {/* Spotlight ring glow */}
      {rect && !isCenterStep && (
        <div
          className="absolute rounded-2xl"
          style={{
            pointerEvents: "none",
            zIndex: 2,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow:
              "0 0 0 3px rgba(179, 96, 80, 0.5), 0 0 20px rgba(179, 96, 80, 0.3)",
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* Tooltip card — render as centered container for center steps, fixed-positioned for others */}
      {isCenterStep ? (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ pointerEvents: "none", zIndex: 10 }}
        >
          <div
            key={`tooltip-${animKey}`}
            style={{
              width: tooltipW,
              pointerEvents: "auto",
              animation:
                "tutorialTooltipPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <TooltipContent
              currentStep={currentStep}
              isLastStep={isLastStep}
              isCenterStep
              steps={steps}
              tutorialStep={tutorialStep}
              nextStep={nextStep}
              skipTutorial={skipTutorial}
            />
          </div>
        </div>
      ) : (
        <div
          key={`tooltip-${animKey}`}
          style={{
            ...tooltipStyle,
            pointerEvents: "auto",
            zIndex: 10,
            animation:
              "tutorialTooltipPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <TooltipContent
            currentStep={currentStep}
            isLastStep={isLastStep}
            isCenterStep={false}
            steps={steps}
            tutorialStep={tutorialStep}
            nextStep={nextStep}
            skipTutorial={skipTutorial}
          />
        </div>
      )}
    </div>
  );
}

// ── Tooltip content (shared between center and positioned renders) ──

function TooltipContent({
  currentStep,
  isLastStep,
  isCenterStep,
  steps,
  tutorialStep,
  nextStep,
  skipTutorial,
}: {
  currentStep: { title: string; description: string };
  isLastStep: boolean;
  isCenterStep: boolean;
  steps: { targetId: string | null }[];
  tutorialStep: number;
  nextStep: () => void;
  skipTutorial: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E4D6C8] px-5 py-5"
      style={{ boxShadow: "0 8px 32px rgba(58,36,24,0.15)" }}
    >
      {/* Roku + content */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0"
          style={{
            animation: "tutorialRokuBounce 2s ease-in-out infinite",
          }}
        >
          <RokuSmall size={isCenterStep ? 64 : 48} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-playfair text-[16px] font-bold text-[#3A2418] leading-tight">
            {currentStep.title}
          </p>
          <p className="font-nunito text-[13px] text-[#6B544D] mt-1 leading-relaxed">
            {currentStep.description}
          </p>
        </div>
      </div>

      {/* Progress dots + buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === tutorialStep ? 16 : 6,
                height: 6,
                backgroundColor:
                  i === tutorialStep
                    ? "#B36050"
                    : i < tutorialStep
                    ? "#F0C8BB"
                    : "#E4D6C8",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isLastStep && (
            <button
              onClick={skipTutorial}
              className="font-nunito text-[12px] font-semibold text-[#9A8578] px-3 py-2 active:opacity-60 transition-opacity"
            >
              Skip
            </button>
          )}
          <button
            onClick={isLastStep ? skipTutorial : nextStep}
            className="h-10 px-6 rounded-full text-white font-nunito font-bold text-[14px] active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #CA8070, #B36050)",
              boxShadow: "0 3px 12px rgba(179,96,80,0.3)",
            }}
          >
            {isLastStep ? "Let's go!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
