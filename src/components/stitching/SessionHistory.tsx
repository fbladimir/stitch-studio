"use client";

import { formatMinutes } from "@/hooks/useStitchingTimer";
import type { StitchSession } from "@/types";

interface SessionHistoryProps {
  sessions: StitchSession[];
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="font-nunito text-[13px] text-[#6B544D]">
          No stitching sessions yet. Start one to track your time!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.slice(0, 20).map((session) => {
        const date = new Date(session.started_at);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const timeStr = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <div
            key={session.id}
            className="bg-white rounded-xl border border-[#E4D6C8] px-3.5 py-3 flex items-center gap-3"
          >
            {/* Date */}
            <div className="w-14 flex-shrink-0 text-center">
              <p className="font-nunito text-[12px] font-bold text-[#3A2418]">{dateStr}</p>
              <p className="font-nunito text-[10px] text-[#6B544D]">{timeStr}</p>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[#E4D6C8]" />

            {/* Stats */}
            <div className="flex-1 flex items-center gap-4">
              <div>
                <p className="font-nunito text-[13px] font-bold text-[#B36050]">
                  {session.stitches_completed.toLocaleString()}
                </p>
                <p className="font-nunito text-[10px] text-[#6B544D]">stitches</p>
              </div>
              <div>
                <p className="font-nunito text-[13px] font-bold text-[#5F7A63]">
                  {formatMinutes(session.duration_minutes)}
                </p>
                <p className="font-nunito text-[10px] text-[#6B544D]">time</p>
              </div>
            </div>

            {/* Notes indicator */}
            {session.notes && (
              <span className="text-[11px] text-[#6B544D]" title={session.notes}>
                📝
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
