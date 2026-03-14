"use client";

import { useEffect, useState } from "react";
import type { PatternThread, ThreadInventoryItem } from "@/types";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";

interface Suggestion {
  manufacturer: string;
  color_number: string;
  color_name: string;
  reason: string;
}

interface SubstitutionHelperProps {
  missingThread: PatternThread;
  availableThreads: ThreadInventoryItem[];
  onClose: () => void;
}

export function SubstitutionHelper({
  missingThread,
  availableThreads,
  onClose,
}: SubstitutionHelperProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generalAdvice, setGeneralAdvice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useBottomSheetDrag({ onClose });

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch("/api/ai/kitting-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missing_thread: {
              manufacturer: missingThread.manufacturer || "DMC",
              color_number: missingThread.color_number || "",
              color_name: missingThread.color_name || "",
            },
            available_threads: availableThreads.map((t) => ({
              manufacturer: t.manufacturer,
              color_number: t.color_number || "",
              color_name: t.color_name || "",
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to get suggestions");

        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setGeneralAdvice(data.general_advice || "");
      } catch {
        setError("Could not get substitution suggestions. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [missingThread, availableThreads]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" data-sheet-backdrop />
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-3 pb-6 flex flex-col gap-4 animate-slideUp max-h-[80vh] overflow-y-auto"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-2 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-[#D0C4BC]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
              Thread Substitution
            </p>
            <p className="font-nunito text-[12px] text-[#896E66] mt-0.5">
              Finding alternatives for {missingThread.manufacturer} {missingThread.color_number}
              {missingThread.color_name ? ` (${missingThread.color_name})` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#E4D6C8] flex items-center justify-center text-[#896E66] text-sm active:scale-95"
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-3 border-[#E4D6C8] border-t-[#B36050] rounded-full animate-spin" />
            <p className="font-nunito text-[13px] text-[#896E66]">
              Checking your stash for substitutes...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-xl px-4 py-3">
            <p className="font-nunito text-[13px] text-[#B03020]">{error}</p>
          </div>
        )}

        {/* Suggestions */}
        {!loading && !error && (
          <>
            {suggestions.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="font-nunito font-bold text-[13px] text-[#5F7A63]">
                  ✨ Found {suggestions.length} substitute{suggestions.length !== 1 ? "s" : ""} in your stash
                </p>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="bg-[#EBF2EC] border border-[#5F7A63]/15 rounded-xl px-4 py-3 flex flex-col gap-1.5"
                  >
                    <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
                      {s.manufacturer} {s.color_number}
                      {s.color_name ? ` · ${s.color_name}` : ""}
                    </p>
                    <p className="font-nunito text-[12px] text-[#5F7A63] leading-relaxed">
                      {s.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-xl px-4 py-4 text-center">
                <p className="font-nunito text-[13px] text-[#AE7C2A]">
                  No close substitutes found in your current stash
                </p>
              </div>
            )}

            {/* General advice */}
            {generalAdvice && (
              <div className="bg-[#FAF6F0] border border-[#E4D6C8] rounded-xl px-4 py-3">
                <p className="font-nunito text-[11px] text-[#896E66] uppercase tracking-wide mb-1 font-bold">
                  Advisor tip
                </p>
                <p className="font-nunito text-[13px] text-[#3A2418] leading-relaxed">
                  {generalAdvice}
                </p>
              </div>
            )}
          </>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[14px] active:scale-[0.98]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
