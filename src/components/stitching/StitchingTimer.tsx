"use client";

import type { TimerState } from "@/hooks/useStitchingTimer";

interface StitchingTimerProps {
  formatted: string;
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function StitchingTimer({
  formatted,
  timerState,
  onStart,
  onPause,
  onResume,
  onStop,
}: StitchingTimerProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Timer display */}
      <div
        className="font-playfair text-[56px] font-bold tabular-nums leading-none"
        style={{
          color: timerState === "running" ? "#5F7A63" : timerState === "paused" ? "#AE7C2A" : "#3A2418",
          animation: timerState === "paused" ? "pulse 2s ease-in-out infinite" : undefined,
        }}
      >
        {formatted}
      </div>

      {/* Timer state label */}
      <p className="font-nunito text-[12px] font-semibold uppercase tracking-widest text-[#6B544D]">
        {timerState === "running"
          ? "Stitching..."
          : timerState === "paused"
          ? "Paused"
          : "Ready to stitch"}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {timerState === "idle" && (
          <button
            onClick={onStart}
            className="w-[180px] h-14 rounded-full text-white font-nunito font-bold text-[16px] active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #5F7A63, #4A6B4E)",
              boxShadow: "0 6px 20px rgba(95, 122, 99, 0.35)",
            }}
          >
            ▶ Start Stitching
          </button>
        )}

        {timerState === "running" && (
          <>
            <button
              onClick={onPause}
              className="w-[120px] h-14 rounded-full bg-[#FBF5E8] border-2 border-[#AE7C2A] text-[#AE7C2A] font-nunito font-bold text-[15px] active:scale-95 transition-transform"
            >
              ⏸ Pause
            </button>
            <button
              onClick={onStop}
              className="w-[120px] h-14 rounded-full bg-[#FDF4F1] border-2 border-[#B36050] text-[#B36050] font-nunito font-bold text-[15px] active:scale-95 transition-transform"
            >
              ⏹ Finish
            </button>
          </>
        )}

        {timerState === "paused" && (
          <>
            <button
              onClick={onResume}
              className="w-[120px] h-14 rounded-full text-white font-nunito font-bold text-[15px] active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #5F7A63, #4A6B4E)",
                boxShadow: "0 4px 14px rgba(95, 122, 99, 0.3)",
              }}
            >
              ▶ Resume
            </button>
            <button
              onClick={onStop}
              className="w-[120px] h-14 rounded-full bg-[#FDF4F1] border-2 border-[#B36050] text-[#B36050] font-nunito font-bold text-[15px] active:scale-95 transition-transform"
            >
              ⏹ Finish
            </button>
          </>
        )}
      </div>
    </div>
  );
}
