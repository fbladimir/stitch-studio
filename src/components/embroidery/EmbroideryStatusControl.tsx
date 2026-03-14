"use client";

import { useState } from "react";
import type { Pattern } from "@/types";
import { updateEmbroidery } from "@/lib/supabase/queries";

type EmbroideryStatus = "not_started" | "wip" | "finished";

interface EmbroideryStatusControlProps {
  embroidery: Pattern;
  onUpdate: (updated: Pattern) => void;
}

const STATUS_OPTIONS: {
  value: EmbroideryStatus;
  emoji: string;
  label: string;
}[] = [
  { value: "not_started", emoji: "🌱", label: "Not Started" },
  { value: "wip", emoji: "🌸", label: "In Progress" },
  { value: "finished", emoji: "✅", label: "Finished" },
];

function getStatus(e: Pattern): EmbroideryStatus {
  if (e.completion_date) return "finished";
  if (e.wip) return "wip";
  return "not_started";
}

const STATUS_DESCRIPTIONS: Record<EmbroideryStatus, { text: string; classes: string }> = {
  not_started: {
    text: "This design is waiting for its moment to shine.",
    classes: "bg-[#FAF6F0] text-[#6B544D] border-[#E4D6C8]",
  },
  wip: {
    text: "You're stitching — every thread brings it closer to life! 🌸",
    classes: "bg-[#FBF5E8] text-[#AE7C2A] border-[#E8D5A0]",
  },
  finished: {
    text: "Beautifully finished. You made something wonderful! ✿",
    classes: "bg-[#EBF2EC] text-[#5F7A63] border-[#C0D4C2]",
  },
};

export function EmbroideryStatusControl({
  embroidery,
  onUpdate,
}: EmbroideryStatusControlProps) {
  const [saving, setSaving] = useState(false);
  const current = getStatus(embroidery);

  async function handleSelect(next: EmbroideryStatus) {
    if (next === current || saving) return;
    setSaving(true);

    const now = new Date();
    let updates: Partial<Pattern> = {};

    if (next === "not_started") {
      updates = {
        wip: false,
        completion_date: null,
        days_to_complete: null,
      };
    } else if (next === "wip") {
      updates = {
        wip: true,
        completion_date: null,
        days_to_complete: null,
        ...(embroidery.start_date ? {} : { start_date: now.toISOString() }),
      };
    } else if (next === "finished") {
      let days: number | null = null;
      if (embroidery.start_date) {
        days = Math.ceil(
          (now.getTime() - new Date(embroidery.start_date).getTime()) / 86400000
        );
      }
      updates = {
        wip: false,
        wip_pct: 100,
        completion_date: now.toISOString(),
        days_to_complete: days,
        ...(embroidery.start_date ? {} : { start_date: now.toISOString() }),
      };
    }

    const { data } = await updateEmbroidery(embroidery.id, updates);
    if (data) onUpdate(data);
    setSaving(false);
  }

  const desc = STATUS_DESCRIPTIONS[current];

  return (
    <div className="flex flex-col gap-3">
      {/* Segmented control */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ backgroundColor: "#EDE5DC" }}
      >
        {STATUS_OPTIONS.map((opt) => {
          const isActive = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl font-nunito font-semibold text-[12px] transition-all duration-200 active:scale-[0.97] disabled:opacity-60 ${
                isActive
                  ? "bg-white text-[#3A2418] shadow-sm"
                  : "text-[#9A8578]"
              }`}
              style={{
                boxShadow: isActive ? "0 1px 4px rgba(58,36,24,0.10)" : undefined,
              }}
            >
              <span>{opt.emoji}</span>
              <span className="hidden xs:inline">{opt.label}</span>
              <span className="xs:hidden text-[10px]">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status description */}
      <div className={`px-4 py-3 rounded-xl border font-nunito text-[13px] leading-snug ${desc.classes}`}>
        {desc.text}
      </div>
    </div>
  );
}
