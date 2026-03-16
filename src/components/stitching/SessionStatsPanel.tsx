"use client";

import { useMemo } from "react";
import { formatMinutes } from "@/hooks/useStitchingTimer";
import type { StitchSession } from "@/types";

interface SessionStatsPanelProps {
  sessions: StitchSession[];
  totalStitches: number;  // pattern total
  stitchesDone: number;   // pattern completed
}

export function SessionStatsPanel({
  sessions,
  totalStitches,
  stitchesDone,
}: SessionStatsPanelProps) {
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalSessionStitches = sessions.reduce((sum, s) => sum + s.stitches_completed, 0);

    // Active stitching days (distinct days with sessions)
    const activeDays = new Set(
      sessions.map((s) => new Date(s.started_at).toDateString())
    ).size;

    // Today's stats
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      (s) => new Date(s.started_at).toDateString() === today
    );
    const stitchedToday = todaySessions.reduce((sum, s) => sum + s.stitches_completed, 0);
    const timeToday = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Averages
    const avgStitchesPerDay = activeDays > 0 ? Math.round(totalSessionStitches / activeDays) : 0;
    const avgTimePerDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    // Estimates
    const remaining = totalStitches > 0 ? Math.max(0, totalStitches - stitchesDone) : 0;
    const estDaysToCompletion = avgStitchesPerDay > 0 ? Math.ceil(remaining / avgStitchesPerDay) : null;
    const estCompletionDate = estDaysToCompletion !== null
      ? new Date(Date.now() + estDaysToCompletion * 86400000)
      : null;

    return {
      totalMinutes,
      totalSessionStitches,
      activeDays,
      stitchedToday,
      timeToday,
      avgStitchesPerDay,
      avgTimePerDay,
      estDaysToCompletion,
      estCompletionDate,
    };
  }, [sessions, totalStitches, stitchesDone]);

  if (!stats) {
    return (
      <div className="bg-[#FAF6F0] rounded-2xl border border-[#E4D6C8] px-4 py-6 text-center">
        <span className="text-3xl block mb-2">📊</span>
        <p className="font-nunito text-[13px] text-[#6B544D]">
          Start your first stitching session to see stats here!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Today's stats */}
      <div className="bg-[#EBF2EC] rounded-2xl border border-[#C0D4C2]/50 px-4 py-3">
        <p className="font-nunito text-[10px] font-bold text-[#5F7A63] uppercase tracking-wider mb-2">
          Today
        </p>
        <div className="flex gap-4">
          <div>
            <p className="font-playfair text-[20px] font-bold text-[#5F7A63] leading-tight">
              {stats.stitchedToday.toLocaleString()}
            </p>
            <p className="font-nunito text-[10px] text-[#6B544D]">stitches</p>
          </div>
          <div>
            <p className="font-playfair text-[20px] font-bold text-[#5F7A63] leading-tight">
              {formatMinutes(stats.timeToday)}
            </p>
            <p className="font-nunito text-[10px] text-[#6B544D]">time spent</p>
          </div>
        </div>
      </div>

      {/* Overall stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Total Time" value={formatMinutes(stats.totalMinutes)} />
        <StatCell label="Active Days" value={String(stats.activeDays)} />
        <StatCell label="Avg. Stitches/Day" value={stats.avgStitchesPerDay.toLocaleString()} />
        <StatCell label="Avg. Time/Day" value={formatMinutes(stats.avgTimePerDay)} />
        {stats.estDaysToCompletion !== null && (
          <StatCell label="Est. Days Left" value={String(stats.estDaysToCompletion)} />
        )}
        {stats.estCompletionDate !== null && (
          <StatCell
            label="Est. Completion"
            value={stats.estCompletionDate.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E4D6C8] px-3 py-2.5 text-center">
      <p className="font-playfair text-[16px] font-bold text-[#3A2418] leading-tight">
        {value}
      </p>
      <p className="font-nunito text-[10px] text-[#6B544D] font-semibold uppercase tracking-wide mt-0.5">
        {label}
      </p>
    </div>
  );
}
