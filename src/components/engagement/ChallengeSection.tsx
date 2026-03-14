"use client";

import type { ChallengeProgress } from "@/types";
import { ChallengeCard } from "./ChallengeCard";

interface ChallengeSectionProps {
  challenges: ChallengeProgress[];
}

export function ChallengeSection({ challenges }: ChallengeSectionProps) {
  if (challenges.length === 0) return null;

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-playfair text-lg font-bold text-[#3A2418]">
          Monthly Challenges
        </h2>
        {completedCount > 0 && (
          <span className="font-nunito text-[11px] font-bold text-[#5F7A63]">
            {completedCount}/{challenges.length} done
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {challenges.map((ch) => (
          <ChallengeCard key={ch.id} challenge={ch} />
        ))}
      </div>
    </section>
  );
}
