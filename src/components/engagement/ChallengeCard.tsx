"use client";

import { getChallengesForMonth, getDaysRemainingInMonth } from "@/lib/engagement";
import type { ChallengeProgress } from "@/types";

interface ChallengeCardProps {
  challenge: ChallengeProgress;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const defs = getChallengesForMonth(challenge.month);
  const def = defs.find((d) => d.id === challenge.challenge_id);
  if (!def) return null;

  const progress = Math.min(challenge.progress, challenge.goal);
  const pct = challenge.goal > 0 ? (progress / challenge.goal) * 100 : 0;
  const isComplete = challenge.completed;

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${
        isComplete
          ? "bg-[#EBF2EC] border-[#C0D4C2]"
          : "bg-white border-[#E4D6C8]"
      }`}
      style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-nunito font-bold text-[13px] text-[#3A2418] truncate">
              {def.name}
            </p>
            {isComplete && (
              <span className="px-2 py-0.5 rounded-full bg-[#5F7A63] text-white font-nunito text-[9px] font-bold">
                Done!
              </span>
            )}
          </div>
          <p className="font-nunito text-[11px] text-[#6B544D] mt-0.5">
            {def.description}
          </p>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="font-nunito text-[10px] font-bold text-[#6B544D]">
                {progress}/{challenge.goal}
              </span>
              {!isComplete && (
                <span className="font-nunito text-[10px] text-[#C4AFA6]">
                  {getDaysRemainingInMonth()} days left
                </span>
              )}
            </div>
            <div className="w-full h-2 rounded-full bg-[#F5EEE8] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? "bg-[#5F7A63]" : "bg-[#AE7C2A]"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
