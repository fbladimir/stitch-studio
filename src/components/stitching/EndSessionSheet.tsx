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
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ animation: "fadeSlideUp 0.3s ease-out" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3A2418]/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[420px] mx-4 rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 -8px 40px rgba(58, 36, 24, 0.15)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#E4D6C8]" />
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-4">
          {/* Header */}
          <div className="text-center">
            <span className="text-3xl block mb-1">🎉</span>
            <h3 className="font-playfair text-xl font-bold text-[#3A2418]">
              Great Session!
            </h3>
            <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
              You stitched for <span className="font-bold text-[#5F7A63]">{formatMinutes(durationMinutes)}</span>
            </p>
          </div>

          {/* Stitches input */}
          <div>
            <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
              Stitches completed this session
            </label>
            <input
              type="number"
              min={0}
              value={stitches || ""}
              placeholder="0"
              onChange={(e) => setStitches(Math.max(0, Number(e.target.value) || 0))}
              className="w-full h-12 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[16px] font-bold text-[#3A2418] bg-[#FAF6F0] text-center focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
              Session notes <span className="text-[#9A8578] font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? Any tricky sections?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E4D6C8] font-nunito text-[14px] text-[#3A2418] bg-[#FAF6F0] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578] resize-none"
            />
          </div>

          {/* Progress photo */}
          <div>
            <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
              Progress photo <span className="text-[#9A8578] font-normal">(optional)</span>
            </label>
            {photoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Progress"
                  className="w-full h-32 object-cover rounded-xl"
                />
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
                <label className="flex-1 h-10 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-bold text-[#B36050] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.97] transition-transform">
                  📷 Take Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                  />
                </label>
                <label className="flex-1 h-10 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-bold text-[#B36050] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.97] transition-transform">
                  🖼️ Gallery
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
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
