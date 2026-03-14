"use client";

import { getXpToNextLevel, getLevelForXp, LEVELS } from "@/lib/engagement";

interface XpBarProps {
  totalXp: number;
}

export function XpBar({ totalXp }: XpBarProps) {
  const level = getLevelForXp(totalXp);
  const { current, needed, progress } = getXpToNextLevel(totalXp);
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1);
  const isMaxLevel = !nextLevel;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-nunito text-[11px] font-bold text-[#3A2418]">
          Level {level.level}
        </span>
        {!isMaxLevel && (
          <span className="font-nunito text-[10px] text-[#896E66]">
            {current} / {needed} XP
          </span>
        )}
      </div>
      <div className="w-full h-3 rounded-full bg-[#F5EEE8] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(progress * 100, 2)}%`,
            background: "linear-gradient(90deg, #CA8070, #B36050)",
          }}
        />
      </div>
      {!isMaxLevel ? (
        <p className="font-nunito text-[10px] text-[#C4AFA6] mt-1">
          {needed - current} XP to {nextLevel.title}
        </p>
      ) : (
        <p className="font-nunito text-[10px] text-[#5F7A63] mt-1 font-semibold">
          Max level reached!
        </p>
      )}
    </div>
  );
}
