"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Pattern } from "@/types";
import { updatePattern } from "@/lib/supabase/queries";
import { useEngagement } from "@/hooks/useEngagement";
import { toast } from "sonner";

interface WipTrackerProps {
  pattern: Pattern;
  onUpdate: (updated: Pattern) => void;
}

/**
 * Parse size_stitches to get a total stitch count.
 * Handles: "196 x 196" → 38416, "18751" → 18751, "200 X 300" → 60000
 */
function parseTotalStitches(sizeStitches: string | null): number | null {
  if (!sizeStitches) return null;
  const s = sizeStitches.trim();

  // Try "W x H" or "W X H" pattern
  const match = s.match(/^(\d[\d,]*)\s*[xX×]\s*(\d[\d,]*)$/);
  if (match) {
    const w = parseInt(match[1].replace(/,/g, ""), 10);
    const h = parseInt(match[2].replace(/,/g, ""), 10);
    if (w > 0 && h > 0) return w * h;
  }

  // Try plain number
  const num = parseInt(s.replace(/,/g, ""), 10);
  if (num > 0) return num;

  return null;
}

export function WipTracker({ pattern, onUpdate }: WipTrackerProps) {
  const parsedTotal = parseTotalStitches(pattern.size_stitches);
  const [pct, setPct] = useState(pattern.wip_pct);
  const [stitches, setStitches] = useState(pattern.wip_stitches);
  const [totalStitches, setTotalStitches] = useState<number | "">(parsedTotal ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [startDateValue, setStartDateValue] = useState("");
  const { recordActivity } = useEngagement();

  // Auto-calculate percentage when both total and completed are present
  const autoPercent = useMemo(() => {
    if (typeof totalStitches === "number" && totalStitches > 0 && stitches > 0) {
      return Math.min(100, Math.round((stitches / totalStitches) * 100));
    }
    return null;
  }, [totalStitches, stitches]);

  // Still to do
  const stillToDo = useMemo(() => {
    if (typeof totalStitches === "number" && totalStitches > 0 && stitches >= 0) {
      return Math.max(0, totalStitches - stitches);
    }
    return null;
  }, [totalStitches, stitches]);

  async function saveStartDate() {
    if (!startDateValue) {
      setEditingStartDate(false);
      return;
    }
    const newDate = new Date(startDateValue + "T00:00:00").toISOString();
    if (newDate === pattern.start_date) {
      setEditingStartDate(false);
      return;
    }
    const { data } = await updatePattern(pattern.id, { start_date: newDate });
    if (data) {
      onUpdate(data);
      toast.success("Start date updated!");
    }
    setEditingStartDate(false);
  }

  const effectivePct = autoPercent ?? pct;

  const hasChanges =
    effectivePct !== pattern.wip_pct ||
    stitches !== pattern.wip_stitches ||
    (typeof totalStitches === "number" && String(totalStitches) !== (parsedTotal ? String(parsedTotal) : ""));

  async function save() {
    if (!hasChanges) return;
    setSaving(true);

    const updates: Record<string, unknown> = {
      wip_pct: effectivePct,
      wip_stitches: stitches,
      last_progress_date: new Date().toISOString(),
    };

    // Save total stitches into size_stitches if user entered a new value
    if (typeof totalStitches === "number" && totalStitches > 0) {
      // Preserve original size_stitches if it was a dimension format
      const wasDimension = pattern.size_stitches && /\d+\s*[xX×]\s*\d+/.test(pattern.size_stitches);
      if (!wasDimension || parsedTotal !== totalStitches) {
        // If the user changed the total from what the dimensions computed,
        // store the explicit total alongside (or replace if it was just a number)
        if (wasDimension) {
          updates.size_stitches = `${pattern.size_stitches} (${totalStitches.toLocaleString()} total)`;
        } else {
          updates.size_stitches = String(totalStitches);
        }
      }
    }

    const { data } = await updatePattern(pattern.id, updates);
    if (data) {
      onUpdate(data);
      recordActivity("log_wip_progress");
      toast.success("Progress saved!");
    }
    setSaving(false);
    setDirty(false);
  }

  const hasTotalStitches = typeof totalStitches === "number" && totalStitches > 0;

  return (
    <div className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
      {/* ── Start Stitching button ───────────────────── */}
      <Link
        href={`/stitching/${pattern.id}`}
        className="w-full h-12 rounded-full text-white font-nunito font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        style={{
          background: "linear-gradient(135deg, #5F7A63, #4A6B4E)",
          boxShadow: "0 4px 14px rgba(95, 122, 99, 0.3)",
        }}
      >
        ⏱️ Start Stitching
      </Link>

      {/* ── Stats Grid (R-XP inspired) ───────────────── */}
      {hasTotalStitches && (
        <div className="grid grid-cols-2 gap-2.5">
          <StatBox
            label="Completed"
            value={`${effectivePct}%`}
            color="text-[#5F7A63]"
            bg="bg-[#EBF2EC]"
          />
          <StatBox
            label="Still To Do"
            value={stillToDo !== null ? stillToDo.toLocaleString() : "—"}
            color="text-[#AE7C2A]"
            bg="bg-[#FBF5E8]"
          />
          <StatBox
            label="Stitches Done"
            value={stitches > 0 ? stitches.toLocaleString() : "0"}
            color="text-[#B36050]"
            bg="bg-[#FDF4F1]"
          />
          <StatBox
            label="Total Stitches"
            value={(totalStitches as number).toLocaleString()}
            color="text-[#3A2418]"
            bg="bg-[#F5EEE8]"
          />
        </div>
      )}

      {/* ── Progress bar + percentage ────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-nunito font-bold text-[13px] text-[#3A2418]">
            Progress
          </span>
          <span className="font-playfair text-[22px] font-bold text-[#AE7C2A]">
            {effectivePct}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#F5EEE8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#AE7C2A] transition-all"
            style={{ width: `${effectivePct}%` }}
          />
        </div>
        {autoPercent !== null && (
          <p className="font-nunito text-[11px] text-[#5F7A63] mt-1.5">
            Auto-calculated from {stitches.toLocaleString()} / {(totalStitches as number).toLocaleString()} stitches
          </p>
        )}
        {/* Manual slider — only show if no auto-calculation */}
        {autoPercent === null && (
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => {
              setPct(Number(e.target.value));
              setDirty(true);
            }}
            className="w-full mt-3 accent-[#AE7C2A]"
          />
        )}
      </div>

      {/* ── Stitch Tracking ──────────────────────────── */}
      {!hasTotalStitches && (
        <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-xl px-4 py-3">
          <p className="font-nunito text-[12px] text-[#AE7C2A] font-semibold">
            💡 Enter your total stitch count below to unlock auto-tracking — your percentage and stats will calculate automatically!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Total Stitches (left) */}
        <div>
          <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
            Total stitches
          </label>
          <input
            type="number"
            min={0}
            value={totalStitches}
            placeholder="e.g. 18751"
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setTotalStitches(val);
              setDirty(true);
            }}
            className="w-full h-11 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[14px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578]"
          />
          {pattern.size_stitches && parsedTotal && typeof totalStitches !== "number" && (
            <p className="font-nunito text-[11px] text-[#6B544D] mt-1">
              Design: {pattern.size_stitches} = {parsedTotal.toLocaleString()}
            </p>
          )}
        </div>

        {/* Stitches Completed (right) */}
        <div>
          <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
            Stitches done
          </label>
          <input
            type="number"
            min={0}
            value={stitches || ""}
            placeholder="0"
            onChange={(e) => {
              setStitches(Number(e.target.value));
              setDirty(true);
            }}
            className="w-full h-11 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[14px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578]"
          />
        </div>
      </div>

      {/* ── Dates ────────────────────────────────────── */}
      <div className="flex gap-4 text-[12px] font-nunito text-[#6B544D]">
        {pattern.start_date && (
          <div>
            <p className="font-semibold text-[#3A2418]">Started</p>
            {editingStartDate ? (
              <input
                type="date"
                value={startDateValue}
                onChange={(e) => setStartDateValue(e.target.value)}
                onBlur={saveStartDate}
                autoFocus
                className="w-[130px] h-7 px-1.5 rounded-lg border border-[#E4D6C8] font-nunito text-[12px] text-[#3A2418] bg-white focus:outline-none focus:border-[#B36050]"
              />
            ) : (
              <button
                onClick={() => {
                  setStartDateValue(pattern.start_date!.split("T")[0]);
                  setEditingStartDate(true);
                }}
                className="underline decoration-dotted underline-offset-2 active:text-[#B36050]"
              >
                {formatDate(pattern.start_date)}
              </button>
            )}
          </div>
        )}
        {pattern.last_progress_date && (
          <div>
            <p className="font-semibold text-[#3A2418]">Last updated</p>
            <p>{formatDate(pattern.last_progress_date)}</p>
          </div>
        )}
        {pattern.completion_date && pattern.days_to_complete && (
          <div>
            <p className="font-semibold text-[#3A2418]">Days to complete</p>
            <p>{pattern.days_to_complete} days</p>
          </div>
        )}
      </div>

      {/* ── Save button ──────────────────────────────── */}
      {(dirty || hasChanges) && (
        <button
          onClick={save}
          disabled={saving}
          className="h-11 w-full rounded-full bg-[#AE7C2A] text-white font-nunito font-bold text-[14px] disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {saving ? "Saving…" : "Save progress"}
        </button>
      )}
    </div>
  );
}

// ── Stat box (R-XP inspired) ─────────────────────────────────

function StatBox({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl px-3 py-2.5 flex flex-col items-center text-center`}>
      <span className={`font-playfair text-[20px] font-bold leading-tight ${color}`}>
        {value}
      </span>
      <span className="font-nunito text-[10px] font-semibold text-[#6B544D] uppercase tracking-wide mt-0.5">
        {label}
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
