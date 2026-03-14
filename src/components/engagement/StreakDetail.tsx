"use client";

import { getWeekActivityDots, STREAK_MILESTONES } from "@/lib/engagement";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";

interface StreakDetailProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  onClose: () => void;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakDetail({
  currentStreak,
  longestStreak,
  lastActivityDate,
  onClose,
}: StreakDetailProps) {
  const weekDots = getWeekActivityDots(lastActivityDate, currentStreak);
  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useBottomSheetDrag({ onClose });

  // Next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak);

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" data-sheet-backdrop />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-[#FAF6F0] rounded-t-3xl px-6 pt-3 pb-8 animate-slideUp"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-2 mb-3 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-[#D0C4BC]" />
        </div>

        {/* Streak display */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-5xl" style={{ animation: "flamePulse 2s ease-in-out infinite" }}>
            🔥
          </span>
          <div className="text-center">
            <p className="font-playfair text-4xl font-bold text-[#AE7C2A]">{currentStreak}</p>
            <p className="font-nunito text-[12px] text-[#896E66] font-semibold uppercase tracking-wide">
              day streak
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 justify-center mb-6">
          <div className="text-center bg-white rounded-xl border border-[#E4D6C8] px-5 py-3">
            <p className="font-playfair text-xl font-bold text-[#B36050]">{currentStreak}</p>
            <p className="font-nunito text-[10px] text-[#896E66] uppercase tracking-wide font-semibold">
              Current
            </p>
          </div>
          <div className="text-center bg-white rounded-xl border border-[#E4D6C8] px-5 py-3">
            <p className="font-playfair text-xl font-bold text-[#5F7A63]">{longestStreak}</p>
            <p className="font-nunito text-[10px] text-[#896E66] uppercase tracking-wide font-semibold">
              Longest
            </p>
          </div>
        </div>

        {/* This week */}
        <div className="mb-6">
          <p className="font-nunito text-[12px] font-bold text-[#3A2418] mb-3 text-center uppercase tracking-wide">
            This Week
          </p>
          <div className="flex justify-center gap-3">
            {weekDots.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    active
                      ? "bg-[#AE7C2A] text-white"
                      : "bg-[#F5EEE8] text-[#C4AFA6]"
                  }`}
                >
                  {active ? "✓" : ""}
                </div>
                <span className="font-nunito text-[10px] text-[#896E66] font-semibold">
                  {DAY_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next milestone */}
        {nextMilestone && (
          <div className="bg-[#FBF5E8] rounded-xl border border-[#E8D5A0] px-4 py-3 text-center">
            <p className="font-nunito text-[12px] text-[#896E66]">
              Next milestone:{" "}
              <span className="font-bold text-[#AE7C2A]">
                {nextMilestone.days} days
              </span>
            </p>
            <p className="font-nunito text-[11px] text-[#896E66] mt-0.5">
              {nextMilestone.days - currentStreak} days to go!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
