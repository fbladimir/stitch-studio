"use client";

import { useState } from "react";
import { getStreakMessage } from "@/lib/engagement";
import { StreakDetail } from "./StreakDetail";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export function StreakCard({ currentStreak, longestStreak, lastActivityDate }: StreakCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const message = getStreakMessage(currentStreak);
  const isActive = currentStreak > 0;

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="w-full bg-white rounded-2xl border border-[#E4D6C8] px-4 py-3.5 flex items-center gap-3 active:scale-[0.97] transition-transform text-left"
        style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}
      >
        {/* Flame */}
        <div className="relative">
          <span
            className="text-3xl leading-none block"
            style={isActive ? { animation: "flamePulse 2s ease-in-out infinite" } : { opacity: 0.4 }}
          >
            🔥
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-playfair text-2xl font-bold text-[#AE7C2A] leading-none">
              {currentStreak}
            </span>
            <span className="font-nunito text-[11px] font-semibold text-[#896E66] uppercase tracking-wide">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="font-nunito text-[12px] text-[#896E66] mt-0.5 truncate">
            {message}
          </p>
        </div>

        <span className="text-[#C4AFA6] font-bold text-lg flex-shrink-0">›</span>
      </button>

      {showDetail && (
        <StreakDetail
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          lastActivityDate={lastActivityDate}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
