"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPattern, getStitchSessions, updatePattern } from "@/lib/supabase/queries";
import { useStitchingTimer } from "@/hooks/useStitchingTimer";
import { StitchingTimer } from "@/components/stitching/StitchingTimer";
import { StitchCounter } from "@/components/stitching/StitchCounter";
import { DailyTargetRing } from "@/components/stitching/DailyTargetRing";
import { SessionStatsPanel } from "@/components/stitching/SessionStatsPanel";
import { SessionHistory } from "@/components/stitching/SessionHistory";
import { EndSessionSheet } from "@/components/stitching/EndSessionSheet";
import { toast } from "sonner";
import type { Pattern, StitchSession } from "@/types";

function parseTotalStitches(sizeStitches: string | null): number {
  if (!sizeStitches) return 0;
  const s = sizeStitches.trim();
  const match = s.match(/^(\d[\d,]*)\s*[xX×]\s*(\d[\d,]*)$/);
  if (match) {
    const w = parseInt(match[1].replace(/,/g, ""), 10);
    const h = parseInt(match[2].replace(/,/g, ""), 10);
    if (w > 0 && h > 0) return w * h;
  }
  // Check for "(N total)" format
  const totalMatch = s.match(/\((\d[\d,]*)\s*total\)/);
  if (totalMatch) return parseInt(totalMatch[1].replace(/,/g, ""), 10);
  const num = parseInt(s.replace(/,/g, ""), 10);
  return num > 0 ? num : 0;
}

export default function StitchingModePage() {
  const params = useParams();
  const patternId = params.id as string;

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [sessions, setSessions] = useState<StitchSession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stitchCount, setStitchCount] = useState(0);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [endSessionData, setEndSessionData] = useState<{
    durationMinutes: number;
    sessionStartedAt: string;
  } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState("");

  const timer = useStitchingTimer(patternId);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [patternRes, sessionsRes] = await Promise.all([
      getPattern(patternId),
      getStitchSessions(patternId),
    ]);

    if (patternRes.data) setPattern(patternRes.data);
    setSessions(sessionsRes.data ?? []);
    setLoading(false);
  }, [patternId]);

  useEffect(() => { load(); }, [load]);

  // Calculate today's stitches from sessions
  const today = new Date().toDateString();
  const stitchedToday = sessions
    .filter((s) => new Date(s.started_at).toDateString() === today)
    .reduce((sum, s) => sum + s.stitches_completed, 0) + (timer.timerState !== "idle" ? stitchCount : 0);

  const handleStop = () => {
    const result = timer.stop();
    setEndSessionData({
      durationMinutes: result.durationMinutes,
      sessionStartedAt: result.sessionStartedAt ?? new Date().toISOString(),
    });
    setShowEndSheet(true);
  };

  const handleSessionComplete = () => {
    setShowEndSheet(false);
    setEndSessionData(null);
    setStitchCount(0);
    timer.reset();
    load(); // Reload sessions
  };

  const handleDiscardSession = () => {
    setShowEndSheet(false);
    setEndSessionData(null);
    setStitchCount(0);
    timer.reset();
  };

  const saveTarget = async () => {
    if (!pattern) return;
    const val = parseInt(targetValue, 10) || 0;
    await updatePattern(pattern.id, { daily_stitch_target: val });
    setPattern({ ...pattern, daily_stitch_target: val });
    setEditingTarget(false);
    toast.success(val > 0 ? `Daily target set to ${val} stitches` : "Daily target removed");
  };

  if (loading || !pattern) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF6F0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F0C8BB] border-t-[#B36050] rounded-full animate-spin" />
      </div>
    );
  }

  const totalStitches = parseTotalStitches(pattern.size_stitches);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#FAF6F0] flex flex-col overflow-hidden">
        {/* ── Header ──────────────────────────────────── */}
        <div className="bg-[#3A2418] px-4 pt-2 pb-3 flex items-center gap-3" style={{ paddingTop: "max(8px, env(safe-area-inset-top, 8px))" }}>
          {/* Cover photo thumbnail */}
          <div className="w-10 h-10 rounded-lg bg-[#5A4438] flex-shrink-0 overflow-hidden flex items-center justify-center">
            {pattern.cover_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pattern.cover_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg opacity-40">📖</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-nunito text-[14px] font-bold text-white truncate">
              {pattern.name}
            </p>
            {pattern.designer && (
              <p className="font-nunito text-[11px] text-white/60 truncate">
                {pattern.designer}
              </p>
            )}
          </div>

          <Link
            href={`/patterns/${patternId}`}
            className="h-9 px-3 rounded-xl bg-white/10 text-white font-nunito text-[12px] font-bold flex items-center active:scale-95 transition-transform"
          >
            ← Exit
          </Link>
        </div>

        {/* ── Main content (scrollable) ───────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-6 flex flex-col gap-6 max-w-[480px] mx-auto w-full">

            {/* Timer */}
            <section className="text-center">
              <StitchingTimer
                formatted={timer.formatted}
                timerState={timer.timerState}
                onStart={timer.start}
                onPause={timer.pause}
                onResume={timer.resume}
                onStop={handleStop}
              />
            </section>

            {/* Stitch counter (visible when timer running or paused) */}
            {timer.timerState !== "idle" && (
              <section className="bg-white rounded-2xl border border-[#E4D6C8] p-4" style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}>
                <StitchCounter count={stitchCount} onChange={setStitchCount} />
              </section>
            )}

            {/* Daily target */}
            <section className="bg-white rounded-2xl border border-[#E4D6C8] p-4" style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}>
              {(pattern.daily_stitch_target ?? 0) > 0 && !editingTarget ? (
                <>
                  <DailyTargetRing
                    stitchedToday={stitchedToday}
                    target={pattern.daily_stitch_target ?? 0}
                  />
                  <button
                    onClick={() => { setTargetValue(String(pattern.daily_stitch_target ?? 0)); setEditingTarget(true); }}
                    className="mt-3 font-nunito text-[12px] text-[#B36050] font-semibold"
                  >
                    Edit target
                  </button>
                </>
              ) : editingTarget ? (
                <div className="flex flex-col gap-2">
                  <label className="font-nunito font-semibold text-[13px] text-[#3A2418]">
                    Daily stitch target
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={targetValue}
                      placeholder="e.g. 350"
                      autoFocus
                      onChange={(e) => setTargetValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveTarget()}
                      className="flex-1 h-11 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[14px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050]"
                    />
                    <button
                      onClick={saveTarget}
                      className="h-11 px-4 rounded-xl bg-[#B36050] text-white font-nunito font-bold text-[13px] active:scale-95"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTarget(false)}
                      className="h-11 px-3 rounded-xl border border-[#E4D6C8] text-[#6B544D] font-nunito text-[13px] active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setTargetValue("350"); setEditingTarget(true); }}
                  className="w-full py-4 flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-[#E4D6C8] active:border-[#B36050] active:bg-[#FDF4F1] transition-colors"
                >
                  <span className="text-2xl">🎯</span>
                  <p className="font-nunito text-[13px] font-bold text-[#3A2418]">Set a daily target</p>
                  <p className="font-nunito text-[11px] text-[#6B544D]">Track your daily stitching goal</p>
                </button>
              )}
            </section>

            {/* Stats panel (collapsible) */}
            <section>
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between mb-3"
              >
                <h2 className="font-playfair text-lg font-bold text-[#3A2418]">
                  📊 Stitching Stats
                </h2>
                <span className="font-nunito text-[13px] text-[#B36050] font-semibold">
                  {showStats ? "Hide" : "Show"}
                </span>
              </button>
              {showStats && (
                <SessionStatsPanel
                  sessions={sessions}
                  totalStitches={totalStitches}
                  stitchesDone={pattern.wip_stitches ?? 0}
                />
              )}
            </section>

            {/* Session history */}
            <section>
              <h2 className="font-playfair text-lg font-bold text-[#3A2418] mb-3">
                📋 Session History
              </h2>
              <SessionHistory sessions={sessions} />
            </section>

          </div>
        </div>
      </div>

      {/* End session sheet */}
      {showEndSheet && endSessionData && userId && (
        <EndSessionSheet
          pattern={pattern}
          userId={userId}
          durationMinutes={endSessionData.durationMinutes}
          sessionStartedAt={endSessionData.sessionStartedAt}
          stitchCount={stitchCount}
          onComplete={handleSessionComplete}
          onCancel={handleDiscardSession}
        />
      )}
    </>
  );
}
