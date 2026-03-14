"use client";

import { useState } from "react";
import type { Pattern } from "@/types";
import { updatePattern } from "@/lib/supabase/queries";
import { useEngagement } from "@/hooks/useEngagement";
import { toast } from "sonner";

interface WipTrackerProps {
  pattern: Pattern;
  onUpdate: (updated: Pattern) => void;
}

export function WipTracker({ pattern, onUpdate }: WipTrackerProps) {
  const [pct, setPct] = useState(pattern.wip_pct);
  const [stitches, setStitches] = useState(pattern.wip_stitches);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [startDateValue, setStartDateValue] = useState("");
  const { recordActivity } = useEngagement();

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

  const hasChanges =
    pct !== pattern.wip_pct || stitches !== pattern.wip_stitches;

  async function save() {
    if (!hasChanges) return;
    setSaving(true);
    const { data } = await updatePattern(pattern.id, {
      wip_pct: pct,
      wip_stitches: stitches,
      last_progress_date: new Date().toISOString(),
    });
    if (data) {
      onUpdate(data);
      recordActivity("log_wip_progress");
      toast.success("Progress saved!");
    }
    setSaving(false);
    setDirty(false);
  }

  return (
    <div className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-nunito font-bold text-[13px] text-[#3A2418]">
            Progress
          </span>
          <span className="font-playfair text-[22px] font-bold text-[#AE7C2A]">
            {pct}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#F5EEE8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#AE7C2A] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
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
      </div>

      {/* Stitches */}
      <div>
        <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
          Stitches completed
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
          className="w-full h-11 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[14px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050]"
        />
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-[12px] font-nunito text-[#896E66]">
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

      {/* Save button */}
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
