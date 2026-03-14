"use client";

import { useEffect, useState } from "react";
import type { WipJournalEntry } from "@/types";
import { getWipJournal, addWipJournalEntry } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { useEngagement } from "@/hooks/useEngagement";
import { toast } from "sonner";

interface WipJournalProps {
  patternId: string;
  currentPct: number;
  currentStitches: number;
}

export function WipJournal({ patternId, currentPct, currentStitches }: WipJournalProps) {
  const [entries, setEntries] = useState<WipJournalEntry[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { recordActivity } = useEngagement();

  useEffect(() => {
    getWipJournal(patternId).then(({ data }) => {
      setEntries(data ?? []);
      setLoading(false);
    });
  }, [patternId]);

  async function submit() {
    if (!note.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data } = await addWipJournalEntry({
      pattern_id: patternId,
      user_id: user.id,
      note: note.trim(),
      pct_at_time: currentPct,
      stitches_at_time: currentStitches || null,
    });

    if (data) {
      setEntries((prev) => [data, ...prev]);
      setNote("");
      recordActivity("write_journal");
      toast.success("Note added!");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add note */}
      <div className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <label className="font-nunito font-bold text-[13px] text-[#3A2418] block mb-2">
          Add a progress note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How's it coming along? Any challenges? Thoughts on the colors…"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-[#E4D6C8] font-nunito text-[14px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050] resize-none placeholder:text-[#C4AFA6]"
        />
        <button
          onClick={submit}
          disabled={!note.trim() || saving}
          className="mt-3 h-10 px-5 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[13px] disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {saving ? "Saving…" : "Add note"}
        </button>
      </div>

      {/* Entries */}
      {!loading && entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-[#FAF6F0] border border-[#E4D6C8] rounded-2xl px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-nunito text-[11px] text-[#896E66]">
                  {formatDateTime(entry.created_at)}
                </span>
                {entry.pct_at_time !== null && (
                  <span className="font-nunito text-[11px] font-bold text-[#AE7C2A] bg-[#FBF5E8] px-2 py-0.5 rounded-full">
                    {entry.pct_at_time}%
                  </span>
                )}
              </div>
              <p className="font-nunito text-[13px] text-[#3A2418] leading-relaxed">
                {entry.note}
              </p>
              {entry.stitches_at_time !== null && entry.stitches_at_time > 0 && (
                <p className="font-nunito text-[11px] text-[#896E66] mt-1">
                  {entry.stitches_at_time.toLocaleString()} stitches
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="font-nunito text-[13px] text-[#B6A090] text-center py-2">
          No notes yet — add your first progress update above!
        </p>
      )}
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
