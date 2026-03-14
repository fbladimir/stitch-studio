"use client";

import { useState } from "react";
import { ACHIEVEMENTS, getAchievementDef } from "@/lib/engagement";
import { AchievementBadge } from "./AchievementBadge";
import type { Achievement } from "@/types";

interface AchievementShelfProps {
  earned: Achievement[];
}

const CATEGORIES = [
  { key: "collection", label: "Collection" },
  { key: "finishing", label: "Finishing" },
  { key: "stash", label: "Stash" },
  { key: "streak", label: "Streaks" },
  { key: "special", label: "Special" },
] as const;

export function AchievementShelf({ earned }: AchievementShelfProps) {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const earnedMap = new Map(earned.map((a) => [a.achievement_id, a]));

  const selectedDef = selectedBadge ? getAchievementDef(selectedBadge) : null;
  const selectedEarned = selectedBadge ? earnedMap.get(selectedBadge) : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="text-center">
        <p className="font-playfair text-2xl font-bold text-[#3A2418]">
          {earned.length}/{ACHIEVEMENTS.length}
        </p>
        <p className="font-nunito text-[12px] text-[#896E66] font-semibold uppercase tracking-wide">
          Badges Earned
        </p>
      </div>

      {/* Categories */}
      {CATEGORIES.map(({ key, label }) => {
        const badges = ACHIEVEMENTS.filter((a) => a.category === key);
        return (
          <div key={key}>
            <h3 className="font-nunito text-[12px] font-bold text-[#3A2418] uppercase tracking-wide mb-3">
              {label}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {badges.map((badge) => (
                <AchievementBadge
                  key={badge.id}
                  achievementId={badge.id}
                  earned={earnedMap.has(badge.id)}
                  earnedAt={earnedMap.get(badge.id)?.earned_at}
                  onTap={() => setSelectedBadge(badge.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Detail modal */}
      {selectedDef && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          onClick={() => setSelectedBadge(null)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-2xl p-6 max-w-[300px] w-full text-center"
            style={{ animation: "fadeSlideUp 0.3s ease-out both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-5xl block mb-3">{selectedDef.icon}</span>
            <h3 className="font-playfair text-xl font-bold text-[#3A2418]">
              {selectedDef.name}
            </h3>
            <p className="font-nunito text-[13px] text-[#896E66] mt-1">
              {selectedDef.description}
            </p>
            {selectedEarned ? (
              <p className="font-nunito text-[12px] text-[#5F7A63] mt-3 font-semibold">
                Earned{" "}
                {new Date(selectedEarned.earned_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            ) : (
              <p className="font-nunito text-[12px] text-[#C4AFA6] mt-3 italic">
                {selectedDef.earnDescription}
              </p>
            )}
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-4 px-6 py-2 rounded-full bg-[#FDF4F1] font-nunito text-[13px] font-bold text-[#B36050] active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
