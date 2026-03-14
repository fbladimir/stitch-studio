"use client";

import { useState } from "react";
import type { PatternThread, ThreadInventoryItem } from "@/types";
import { SubstitutionHelper } from "./SubstitutionHelper";

interface KittingCheckResult {
  threads_have: { thread: PatternThread; inventory: ThreadInventoryItem }[];
  threads_missing: PatternThread[];
  fabric_match: boolean;
  fabric_note: string | null;
  is_ready: boolean;
}

interface KittingResultProps {
  patternName: string;
  result: KittingCheckResult;
  allInventoryThreads: ThreadInventoryItem[];
  onMarkKitted?: () => void;
}

export function KittingResult({
  patternName,
  result,
  allInventoryThreads,
  onMarkKitted,
}: KittingResultProps) {
  const [expandMissing, setExpandMissing] = useState(true);
  const [substituteFor, setSubstituteFor] = useState<PatternThread | null>(null);

  const totalThreads = result.threads_have.length + result.threads_missing.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Status banner */}
      {result.is_ready ? (
        <div className="bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-2xl px-4 py-5 text-center flex flex-col gap-2">
          <span className="text-4xl">✅</span>
          <p className="font-playfair font-bold text-[18px] text-[#5F7A63]">
            Ready to kit!
          </p>
          <p className="font-nunito text-[13px] text-[#5F7A63]">
            You have everything you need for &ldquo;{patternName}&rdquo;
          </p>
          {onMarkKitted && (
            <button
              onClick={onMarkKitted}
              className="mt-2 w-full h-12 rounded-full bg-[#5F7A63] text-white font-nunito font-bold text-[14px] active:scale-[0.98] shadow-md"
            >
              Mark as Kitted 🧺
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-2xl px-4 py-5 text-center flex flex-col gap-2">
          <span className="text-4xl">🛒</span>
          <p className="font-playfair font-bold text-[18px] text-[#AE7C2A]">
            Almost there!
          </p>
          <p className="font-nunito text-[13px] text-[#AE7C2A]">
            You&apos;re missing {result.threads_missing.length} of {totalThreads} thread
            {totalThreads !== 1 ? "s" : ""} for &ldquo;{patternName}&rdquo;
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-nunito font-bold text-[13px] text-[#3A2418]">Thread Coverage</p>
          <p className="font-nunito text-[12px] text-[#896E66]">
            {result.threads_have.length}/{totalThreads}
          </p>
        </div>
        <div className="h-3 bg-[#FAF6F0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalThreads > 0 ? (result.threads_have.length / totalThreads) * 100 : 0}%`,
              backgroundColor: result.is_ready ? "#5F7A63" : "#AE7C2A",
            }}
          />
        </div>
      </div>

      {/* Threads you have */}
      {result.threads_have.length > 0 && (
        <div className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
          <p className="font-nunito font-bold text-[13px] text-[#5F7A63] mb-3">
            ✅ Threads you have ({result.threads_have.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {result.threads_have.map(({ thread, inventory }) => (
              <div
                key={thread.id}
                className="bg-[#EBF2EC]/50 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded bg-[#5F7A63]/10 flex-shrink-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold font-nunito text-[#5F7A63]">✓</span>
                </div>
                <p className="font-nunito text-[12px] text-[#3A2418] flex-1 truncate">
                  {thread.manufacturer} {thread.color_number}
                  {thread.color_name ? ` · ${thread.color_name}` : ""}
                </p>
                <span className="font-nunito text-[11px] text-[#5F7A63]">
                  ×{inventory.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threads missing */}
      {result.threads_missing.length > 0 && (
        <div className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
          <button
            onClick={() => setExpandMissing(!expandMissing)}
            className="w-full flex items-center justify-between"
          >
            <p className="font-nunito font-bold text-[13px] text-[#B03020]">
              ❌ Missing ({result.threads_missing.length})
            </p>
            <span className="text-[#896E66] text-sm">{expandMissing ? "▲" : "▼"}</span>
          </button>

          {expandMissing && (
            <div className="flex flex-col gap-1.5 mt-3">
              {result.threads_missing.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-[#FDF0EE]/50 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded bg-[#B03020]/10 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold font-nunito text-[#B03020]">✗</span>
                  </div>
                  <p className="font-nunito text-[12px] text-[#3A2418] flex-1 truncate">
                    {thread.manufacturer} {thread.color_number}
                    {thread.color_name ? ` · ${thread.color_name}` : ""}
                  </p>
                  <button
                    onClick={() => setSubstituteFor(thread)}
                    className="font-nunito text-[11px] text-[#B36050] font-semibold underline"
                  >
                    Substitute?
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fabric check */}
      {result.fabric_note && (
        <div className={`border rounded-2xl px-4 py-3 ${
          result.fabric_match
            ? "bg-[#EBF2EC] border-[#5F7A63]/20"
            : "bg-[#FBF5E8] border-[#AE7C2A]/20"
        }`}>
          <p className={`font-nunito text-[13px] ${
            result.fabric_match ? "text-[#5F7A63]" : "text-[#AE7C2A]"
          }`}>
            {result.fabric_match ? "✅" : "🧶"} {result.fabric_note}
          </p>
        </div>
      )}

      {/* Substitution helper modal */}
      {substituteFor && (
        <SubstitutionHelper
          missingThread={substituteFor}
          availableThreads={allInventoryThreads}
          onClose={() => setSubstituteFor(null)}
        />
      )}
    </div>
  );
}

export type { KittingCheckResult };
