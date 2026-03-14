"use client";

import { useState } from "react";
import type { Pattern } from "@/types";
import { updatePattern } from "@/lib/supabase/queries";
import { useEngagement } from "@/hooks/useEngagement";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";
import { buildFinishCelebration } from "@/lib/engagement";
import { createClient } from "@/lib/supabase/client";

interface StatusTogglesProps {
  pattern: Pattern;
  onUpdate: (updated: Pattern) => void;
}

export function StatusToggles({ pattern, onUpdate }: StatusTogglesProps) {
  const [saving, setSaving] = useState<"kitted" | "wip" | "finished" | null>(null);
  const { recordActivity } = useEngagement();
  const pushCelebration = useAppStore((s) => s.pushCelebration);

  async function toggleKitted() {
    setSaving("kitted");
    const newVal = !pattern.kitted;
    const { data } = await updatePattern(pattern.id, {
      kitted: newVal,
      kitted_date: newVal ? new Date().toISOString() : null,
    });
    if (data) {
      onUpdate(data);
      if (newVal) {
        recordActivity("mark_kitted");
        toast.success("Marked as kitted!");
      }
    }
    setSaving(null);
  }

  async function toggleWip() {
    setSaving("wip");
    const newVal = !pattern.wip;
    const updates: Partial<Pattern> = {
      wip: newVal,
      ...(newVal && !pattern.start_date
        ? { start_date: new Date().toISOString() }
        : {}),
    };
    const { data } = await updatePattern(pattern.id, updates);
    if (data) onUpdate(data);
    setSaving(null);
  }

  async function toggleFinished() {
    setSaving("finished");
    const isFinished = Boolean(pattern.completion_date);

    if (isFinished) {
      // Un-finish
      const { data } = await updatePattern(pattern.id, {
        completion_date: null,
        days_to_complete: null,
      });
      if (data) onUpdate(data);
    } else {
      // Mark finished
      const now = new Date();
      let days: number | null = null;
      if (pattern.start_date) {
        days = Math.ceil(
          (now.getTime() - new Date(pattern.start_date).getTime()) / 86400000
        );
      }
      const { data } = await updatePattern(pattern.id, {
        completion_date: now.toISOString(),
        days_to_complete: days,
        wip: false,
        wip_pct: 100,
      });
      if (data) {
        onUpdate(data);

        // Celebration + XP
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profileData } = user
          ? await supabase.from("profiles").select("display_name, dogs").eq("id", user.id).single()
          : { data: null };
        const displayName = profileData?.display_name || "friend";
        const allDogs = Array.isArray(profileData?.dogs) ? profileData.dogs : [];
        const dogName = allDogs.length > 0 ? `${allDogs[0].emoji} ${allDogs[0].name}` : null;

        pushCelebration(
          buildFinishCelebration(
            pattern.name,
            pattern.cover_photo_url,
            displayName,
            dogName,
            { daysWorked: days ?? undefined, stitches: pattern.wip_stitches || undefined }
          )
        );

        recordActivity("mark_finished");
      }
    }
    setSaving(null);
  }

  const isFinished = Boolean(pattern.completion_date);

  return (
    <div className="flex flex-col gap-3">
      {/* Kitted */}
      <button
        onClick={toggleKitted}
        disabled={saving !== null}
        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-colors active:scale-[0.99] ${
          pattern.kitted
            ? "bg-[#FDF4F1] border-[#F0C8BB]"
            : "bg-white border-[#E4D6C8]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🧺</span>
          <div className="text-left">
            <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
              Kitted
            </p>
            <p className="font-nunito text-[11px] text-[#896E66]">
              {pattern.kitted
                ? "Supplies gathered ✓"
                : "Tap when you've gathered all supplies"}
            </p>
          </div>
        </div>
        <Toggle active={pattern.kitted} loading={saving === "kitted"} />
      </button>

      {/* WIP */}
      <button
        onClick={toggleWip}
        disabled={saving !== null || isFinished}
        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-colors active:scale-[0.99] ${
          pattern.wip
            ? "bg-[#FBF5E8] border-[#E8D5A0]"
            : "bg-white border-[#E4D6C8]"
        } disabled:opacity-50`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">⏱️</span>
          <div className="text-left">
            <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
              Work in Progress
            </p>
            <p className="font-nunito text-[11px] text-[#896E66]">
              {pattern.wip
                ? `${pattern.wip_pct}% complete`
                : "Tap when you start stitching"}
            </p>
          </div>
        </div>
        <Toggle active={pattern.wip} loading={saving === "wip"} color="gold" />
      </button>

      {/* Finished */}
      <button
        onClick={toggleFinished}
        disabled={saving !== null}
        className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-colors active:scale-[0.99] ${
          isFinished
            ? "bg-[#EBF2EC] border-[#C0D4C2]"
            : "bg-white border-[#E4D6C8]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div className="text-left">
            <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
              Finished
            </p>
            <p className="font-nunito text-[11px] text-[#896E66]">
              {isFinished
                ? `Completed ${formatDate(pattern.completion_date!)}`
                : "Tap when it's done!"}
            </p>
          </div>
        </div>
        <Toggle active={isFinished} loading={saving === "finished"} color="sage" />
      </button>
    </div>
  );
}

function Toggle({
  active,
  loading,
  color = "rose",
}: {
  active: boolean;
  loading: boolean;
  color?: "rose" | "gold" | "sage";
}) {
  const bgActive = {
    rose: "bg-[#B36050]",
    gold: "bg-[#AE7C2A]",
    sage: "bg-[#5F7A63]",
  }[color];

  return (
    <div
      className={`relative w-12 h-[26px] rounded-full transition-colors flex-shrink-0 ${
        active ? bgActive : "bg-[#D0C4BC]"
      } ${loading ? "opacity-50" : ""}`}
    >
      <span
        className={`absolute top-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
          active ? "right-[3px] left-auto" : "left-[3px]"
        }`}
      />
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
