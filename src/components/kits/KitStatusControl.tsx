"use client";

import { useState } from "react";
import type { Pattern, KitStatus } from "@/types";
import { updateKit } from "@/lib/supabase/queries";

interface KitStatusControlProps {
  kit: Pattern;
  onUpdate: (updated: Pattern) => void;
}

const SEGMENTS: { value: KitStatus; label: string; emoji: string }[] = [
  { value: "unopened", label: "Unopened", emoji: "📦" },
  { value: "started", label: "Started", emoji: "🪡" },
  { value: "finished", label: "Finished", emoji: "✅" },
];

export function KitStatusControl({ kit, onUpdate }: KitStatusControlProps) {
  const [saving, setSaving] = useState(false);
  const current: KitStatus = kit.kit_status ?? "unopened";

  async function select(next: KitStatus) {
    if (next === current || saving) return;
    setSaving(true);

    const now = new Date().toISOString();
    const updates: Partial<Pattern> = { kit_status: next };

    if (next === "started") {
      // Auto-set start date if not already set
      if (!kit.start_date) updates.start_date = now;
      updates.wip_pct = kit.wip_pct ?? 0;
    }

    if (next === "finished") {
      // Calculate days to complete
      updates.completion_date = now;
      if (kit.start_date) {
        updates.days_to_complete = Math.ceil(
          (new Date(now).getTime() - new Date(kit.start_date).getTime()) /
            86400000
        );
      }
      if (!kit.start_date) updates.start_date = now;
      updates.wip_pct = 100;
    }

    if (next === "unopened") {
      // Roll back progress markers when reverting to unopened
      updates.completion_date = null;
      updates.days_to_complete = null;
    }

    const { data } = await updateKit(kit.id, updates);
    if (data) onUpdate(data);
    setSaving(false);
  }

  const colorActive: Record<KitStatus, string> = {
    unopened: "text-[#896E66]",
    started: "text-[#AE7C2A]",
    finished: "text-[#5F7A63]",
  };

  return (
    <div className="flex flex-col gap-3">
      {/* iOS-style segmented control */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ backgroundColor: "#EDE5DC" }}
      >
        {SEGMENTS.map((seg) => {
          const isActive = current === seg.value;
          return (
            <button
              key={seg.value}
              onClick={() => select(seg.value)}
              disabled={saving}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-60 ${
                isActive
                  ? "bg-white shadow-sm"
                  : "bg-transparent"
              }`}
              style={{
                boxShadow: isActive
                  ? "0 1px 4px rgba(58,36,24,0.10)"
                  : undefined,
              }}
            >
              <span className="text-xl leading-none">{seg.emoji}</span>
              <span
                className={`font-nunito font-bold text-[11px] leading-tight ${
                  isActive ? colorActive[seg.value] : "text-[#B6A090]"
                }`}
              >
                {seg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contextual status description */}
      <div
        className={`rounded-2xl px-4 py-3 border transition-all duration-200 ${
          current === "finished"
            ? "bg-[#EBF2EC] border-[#C0D4C2]"
            : current === "started"
            ? "bg-[#FBF5E8] border-[#E8D5A0]"
            : "bg-[#FAF6F0] border-[#E4D6C8]"
        }`}
      >
        {current === "unopened" && (
          <p className="font-nunito text-[13px] text-[#896E66]">
            This kit is still sealed and waiting for the perfect moment. 📦
          </p>
        )}
        {current === "started" && (
          <p className="font-nunito text-[13px] text-[#AE7C2A]">
            You&apos;re working on this one!{" "}
            {kit.wip_pct > 0 ? `${kit.wip_pct}% done so far. 🪡` : "Track your progress below. 🪡"}
          </p>
        )}
        {current === "finished" && (
          <p className="font-nunito text-[13px] text-[#5F7A63]">
            Finished!{" "}
            {kit.completion_date
              ? `Completed ${formatDate(kit.completion_date)}. 🎉`
              : "What a beautiful finish! 🎉"}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
