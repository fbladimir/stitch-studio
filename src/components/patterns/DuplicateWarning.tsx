"use client";

import type { DuplicateCandidate } from "@/lib/duplicate-detection";

interface DuplicateWarningProps {
  candidates: DuplicateCandidate[];
  onAddAnyway: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DuplicateWarning({
  candidates,
  onAddAnyway,
  onCancel,
  loading,
}: DuplicateWarningProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">⚠️</span>
          <h2 className="font-playfair text-[20px] font-bold text-[#3A2418]">
            Possible Duplicate
          </h2>
        </div>
        <p className="font-nunito text-[13px] text-[#896E66] mb-5">
          {candidates.length === 1
            ? "This pattern looks like one you already have:"
            : `These ${candidates.length} patterns in your collection look similar:`}
        </p>

        {/* Matches */}
        <div className="flex flex-col gap-3 mb-6 max-h-[40vh] overflow-y-auto">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-[#FAF6F0] border border-[#E4D6C8] rounded-xl px-3 py-2.5"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-[#F0E8E0] rounded-xl overflow-hidden flex items-center justify-center">
                {c.cover_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.cover_photo_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xl opacity-30">📖</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-nunito font-bold text-[13px] text-[#3A2418] truncate">
                  {c.name}
                </p>
                {c.designer && (
                  <p className="font-nunito text-[11px] text-[#896E66] truncate">
                    {c.designer}
                  </p>
                )}
                <p className="font-nunito text-[10px] text-[#B36050] font-semibold mt-0.5">
                  {Math.round(c.similarity * 100)}% match
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onAddAnyway}
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[15px] disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {loading ? "Adding…" : "Add anyway — it's different"}
          </button>
          <button
            onClick={onCancel}
            className="w-full h-12 rounded-full border border-[#E4D6C8] bg-white text-[#896E66] font-nunito font-semibold text-[14px] active:scale-[0.98] transition-transform"
          >
            Cancel — go back
          </button>
        </div>
      </div>
    </div>
  );
}
