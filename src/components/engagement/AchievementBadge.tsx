"use client";

import { getAchievementDef } from "@/lib/engagement";

interface AchievementBadgeProps {
  achievementId: string;
  earned: boolean;
  earnedAt?: string;
  size?: "sm" | "md";
  onTap?: () => void;
}

export function AchievementBadge({
  achievementId,
  earned,
  earnedAt,
  size = "md",
  onTap,
}: AchievementBadgeProps) {
  const def = getAchievementDef(achievementId);
  if (!def) return null;

  const isMd = size === "md";

  return (
    <button
      onClick={onTap}
      className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95 ${
        isMd ? "w-full" : ""
      }`}
    >
      {/* Icon circle */}
      <div
        className={`rounded-full flex items-center justify-center border-2 transition-colors ${
          earned
            ? "bg-white border-[#E4D6C8] shadow-sm"
            : "bg-[#F5EEE8] border-[#E4D6C8] opacity-40 grayscale"
        } ${isMd ? "w-16 h-16" : "w-12 h-12"}`}
      >
        <span className={isMd ? "text-2xl" : "text-lg"}>{def.icon}</span>
      </div>

      {/* Name */}
      <p
        className={`font-nunito font-bold text-center leading-tight ${
          earned ? "text-[#3A2418]" : "text-[#C4AFA6]"
        } ${isMd ? "text-[11px]" : "text-[10px]"}`}
      >
        {def.name}
      </p>

      {/* Earned date */}
      {earned && earnedAt && isMd && (
        <p className="font-nunito text-[9px] text-[#6B544D]">
          {new Date(earnedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </button>
  );
}
