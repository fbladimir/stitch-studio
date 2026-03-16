"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createStitchSession, updatePattern, uploadProgressPhoto, createProgressPhoto } from "@/lib/supabase/queries";
import { useEngagement } from "@/hooks/useEngagement";
import { formatMinutes } from "@/hooks/useStitchingTimer";
import { compressImage } from "@/lib/image";
import type { Pattern } from "@/types";

interface EndSessionSheetProps {
  pattern: Pattern;
  userId: string;
  durationMinutes: number;
  sessionStartedAt: string;
  stitchCount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function EndSessionSheet({
  pattern,
  userId,
  durationMinutes,
  sessionStartedAt,
  stitchCount,
  onComplete,
  onCancel,
}: EndSessionSheetProps) {
  const [stitches, setStitches] = useState(stitchCount);
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { recordActivity } = useEngagement();

  const handlePhoto = async (file: File) => {
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Create the session
      const { data: session } = await createStitchSession({
        pattern_id: pattern.id,
        user_id: userId,
        started_at: sessionStartedAt,
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        stitches_completed: stitches,
        notes: notes.trim() || null,
      });

      // 2. Update pattern stitch count
      const newStitches = (pattern.wip_stitches || 0) + stitches;
      await updatePattern(pattern.id, {
        wip_stitches: newStitches,
        last_progress_date: new Date().toISOString(),
      });

      // 3. Upload progress photo if taken
      if (photoFile && session) {
        const { url } = await uploadProgressPhoto(userId, pattern.id, photoFile);
        if (url) {
          await createProgressPhoto({
            pattern_id: pattern.id,
            user_id: userId,
            session_id: session.id,
            photo_url: url,
            caption: notes.trim() || null,
          });
        }
      }

      // 4. Record engagement
      await recordActivity("log_wip_progress");

      toast.success(
        `Session saved! ${stitches > 0 ? `${stitches.toLocaleString()} stitches logged.` : ""}`
      );
      onComplete();
    } catch {
      toast.error("Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3A2418]/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[380px] rounded-3xl bg-white overflow-hidden"
        style={{
          maxHeight: "min(90vh, 520px)",
          boxShadow: "0 24px 48px rgba(58, 36, 24, 0.2)",
          animation: "fadeSlideUp 0.3s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#F5EEE8] flex items-center justify-center text-[#6B544D] text-lg active:scale-90"
          aria-label="Close"
        >
          ×
        </button>

        <div className="flex flex-col max-h-[min(90vh,520px)]">
          {/* Header (fixed) */}
          <div className="flex-shrink-0 text-center pt-5 pb-3 px-6">
            <h3 className="font-playfair text-lg font-bold text-[#3A2418]">
              🎉 Great Session!
            </h3>
            <p className="font-nunito text-[13px] text-[#6B544D] mt-0.5">
              You stitched for <span className="font-bold text-[#5F7A63]">{formatMinutes(durationMinutes)}</span>
            </p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
            <div className="flex flex-col gap-3">
              {/* Stitches */}
              <div>
                <label className="font-nunito font-semibold text-[12px] text-[#3A2418] block mb-1">
                  Stitches completed
                </label>
                <input
                  type="number"
                  min={0}
                  value={stitches || ""}
                  placeholder="0"
                  onChange={(e) => setStitches(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-11 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[15px] font-bold text-[#3A2418] bg-[#FAF6F0] text-center focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-nunito font-semibold text-[12px] text-[#3A2418] block mb-1">
                  Notes <span className="text-[#9A8578] font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it go?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#E4D6C8] font-nunito text-[13px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578] resize-none"
                />
              </div>

              {/* Progress photo */}
              <div>
                <label className="font-nunito font-semibold text-[12px] text-[#3A2418] block mb-1">
                  Progress photo <span className="text-[#9A8578] font-normal">(optional)</span>
                </label>
                {photoPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Progress" className="w-full h-28 object-cover rounded-xl" />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#3A2418]/60 text-white text-sm flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="flex-1 h-9 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[11px] font-bold text-[#B36050] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.97]">
                      📷 Photo
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                    </label>
                    <label className="flex-1 h-9 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[11px] font-bold text-[#B36050] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.97]">
                      🖼️ Gallery
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions (fixed at bottom) */}
          <div className="flex-shrink-0 px-5 pt-2 pb-4 flex flex-col gap-2" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-full text-white font-nunito font-bold text-[15px] active:scale-[0.97] disabled:opacity-60 transition-transform"
              style={{
                background: "linear-gradient(135deg, #5F7A63, #4A6B4E)",
                boxShadow: "0 6px 20px rgba(95, 122, 99, 0.3)",
              }}
            >
              {saving ? "Saving..." : "Save Session ✿"}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 font-nunito text-[13px] font-semibold text-[#6B544D]"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
