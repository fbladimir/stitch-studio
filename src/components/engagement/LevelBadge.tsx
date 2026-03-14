"use client";

import { LEVELS } from "@/lib/engagement";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-[#F5EEE8] text-[#6B544D] border-[#E4D6C8]",
  2: "bg-[#FBF5E8] text-[#AE7C2A] border-[#E8D5A0]",
  3: "bg-[#EBF2EC] text-[#5F7A63] border-[#C0D4C2]",
  4: "bg-[#FDF4F1] text-[#B36050] border-[#F0C8BB]",
  5: "bg-[#FBF5E8] text-[#AE7C2A] border-[#E8D5A0]",
  6: "bg-gradient-to-r from-[#AE7C2A] to-[#B36050] text-white border-[#AE7C2A]",
};

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const levelDef = LEVELS.find((l) => l.level === level) ?? LEVELS[0];
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];

  const sizeClasses =
    size === "lg"
      ? "px-4 py-2 text-[13px]"
      : size === "md"
      ? "px-3 py-1.5 text-[11px]"
      : "px-2 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-nunito font-bold ${colors} ${sizeClasses}`}
    >
      <span>⭐</span>
      <span>{levelDef.title}</span>
    </span>
  );
}
