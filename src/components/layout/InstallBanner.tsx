"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";

/**
 * iOS "Add to Home Screen" instruction banner.
 * Shows once per device (localStorage), only on iOS Safari when NOT already installed as PWA.
 * Dismissible — won't show again after user closes it.
 * Waits until tutorial is finished so it doesn't overlap onboarding flows.
 */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  const isTutorialActive = useAppStore((s) => s.isTutorialActive);

  useEffect(() => {
    // Don't show while tutorial is running
    if (isTutorialActive) return;

    // Only show on iOS Safari, not already in standalone mode
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isStandalone =
      ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("ss_install_dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      // Delay so it doesn't flash on first load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isTutorialActive]);

  function dismiss() {
    setShow(false);
    localStorage.setItem("ss_install_dismissed", "true");
  }

  // Hide while tutorial is active (even if already shown)
  if (!show || isTutorialActive) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-4 right-4 z-[60] animate-slideUp md:hidden">
      <div className="bg-white rounded-2xl border border-[#E4D6C8] shadow-xl px-4 py-4 flex flex-col gap-3">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#6B544D] text-sm active:scale-90"
        >
          ×
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🪡</span>
          </div>
          <div>
            <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
              Add to Home Screen
            </p>
            <p className="font-nunito text-[12px] text-[#6B544D]">
              Get the full app experience!
            </p>
          </div>
        </div>

        <div className="bg-[#FAF6F0] rounded-xl px-3 py-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[11px] flex items-center justify-center flex-shrink-0">1</span>
            <p className="font-nunito text-[13px] text-[#3A2418]">
              Tap the <span className="inline-block px-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span> Share button in Safari
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[11px] flex items-center justify-center flex-shrink-0">2</span>
            <p className="font-nunito text-[13px] text-[#3A2418]">
              Scroll down and tap <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[11px] flex items-center justify-center flex-shrink-0">3</span>
            <p className="font-nunito text-[13px] text-[#3A2418]">
              Tap <span className="font-bold">&ldquo;Add&rdquo;</span> — done!
            </p>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="w-full h-10 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[13px] active:scale-[0.98]"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
