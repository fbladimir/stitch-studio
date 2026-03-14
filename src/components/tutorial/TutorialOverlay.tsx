"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTutorial, TUTORIAL_STEPS } from "@/hooks/useTutorial";
import { useAppStore } from "@/store/appStore";

// ── Small Roku Avatar (inline SVG, reused from intro) ──────────

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

// ── Spotlight + Tooltip overlay ─────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10; // spotlight padding around target element
const TOOLTIP_GAP = 14; // gap between spotlight and tooltip

export function TutorialOverlay() {
  const isTutorialActive = useAppStore((s) => s.isTutorialActive);
  const tutorialStep = useAppStore((s) => s.tutorialStep);
  const { currentStep, totalSteps, nextStep, skipTutorial } = useTutorial();

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [animKey, setAnimKey] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(
      `[data-tutorial-id="${currentStep.targetId}"]`
    );
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    });
  }, [currentStep]);

  // Re-measure on step change and scroll/resize
  useEffect(() => {
    if (!isTutorialActive) return;
    setAnimKey((k) => k + 1);

    // Small delay to let DOM settle
    const timer = setTimeout(measureTarget, 100);

    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [isTutorialActive, tutorialStep, measureTarget]);

  // Scroll target into view if needed
  useEffect(() => {
    if (!isTutorialActive || !currentStep?.targetId) return;

    const el = document.querySelector(
      `[data-tutorial-id="${currentStep.targetId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isTutorialActive, currentStep, tutorialStep]);

  // Position tooltip based on target rect
  useEffect(() => {
    if (!currentStep) return;

    if (!targetRect || currentStep.position === "center") {
      // Center the tooltip on screen
      setTooltipStyle({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const vw = window.innerWidth;
    const tooltipWidth = Math.min(320, vw - 32);
    const tooltipLeft = Math.max(
      16,
      Math.min(
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        vw - tooltipWidth - 16
      )
    );

    if (currentStep.position === "top" || currentStep.position === "left" || currentStep.position === "right") {
      // Place tooltip above the target
      setTooltipStyle({
        bottom: `${window.innerHeight - targetRect.top + TOOLTIP_GAP}px`,
        left: `${tooltipLeft}px`,
        width: `${tooltipWidth}px`,
      });
    } else {
      // Place tooltip below the target
      setTooltipStyle({
        top: `${targetRect.top + targetRect.height + TOOLTIP_GAP}px`,
        left: `${tooltipLeft}px`,
        width: `${tooltipWidth}px`,
      });
    }
  }, [targetRect, currentStep]);

  if (!isTutorialActive || !currentStep) return null;

  const isLastStep = tutorialStep === totalSteps - 1;
  const isCenterStep = currentStep.position === "center";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[300] select-none"
      style={{ touchAction: "none" }}
    >
      {/* Dimmed backdrop with spotlight cutout via CSS mask */}
      {targetRect && !isCenterStep ? (
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: "rgba(58, 36, 24, 0.6)",
            maskImage: `
              linear-gradient(#000 0 0),
              linear-gradient(#000 0 0)
            `,
            WebkitMaskImage: `
              linear-gradient(#000 0 0),
              linear-gradient(#000 0 0)
            `,
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            maskPosition: `0 0, ${targetRect.left}px ${targetRect.top}px`,
            WebkitMaskPosition: `0 0, ${targetRect.left}px ${targetRect.top}px`,
            maskSize: `100% 100%, ${targetRect.width}px ${targetRect.height}px`,
            WebkitMaskSize: `100% 100%, ${targetRect.width}px ${targetRect.height}px`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "rgba(58, 36, 24, 0.65)" }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Spotlight ring glow */}
      {targetRect && !isCenterStep && (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 3px rgba(179, 96, 80, 0.5), 0 0 20px rgba(179, 96, 80, 0.3)",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        key={`tooltip-${animKey}`}
        className="absolute z-10"
        style={{
          ...tooltipStyle,
          animation: "tutorialTooltipPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div
          className={`bg-white rounded-2xl border border-[#E4D6C8] px-5 py-5 ${
            isCenterStep ? "max-w-[320px] w-[320px]" : ""
          }`}
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
              <p className="font-nunito text-[13px] text-[#896E66] mt-1 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Progress dots + buttons */}
          <div className="flex items-center justify-between mt-4">
            {/* Dots */}
            <div className="flex gap-1.5">
              {TUTORIAL_STEPS.map((_, i) => (
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

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <button
                  onClick={skipTutorial}
                  className="font-nunito text-[12px] font-semibold text-[#B6A090] px-2 py-1 active:opacity-60 transition-opacity"
                >
                  Skip
                </button>
              )}
              <button
                onClick={isLastStep ? skipTutorial : nextStep}
                className="h-9 px-5 rounded-full text-white font-nunito font-bold text-[13px] active:scale-95 transition-transform"
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
      </div>
    </div>
  );
}
