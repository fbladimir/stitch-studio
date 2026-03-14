"use client";

import Link from "next/link";
import type { Pattern } from "@/types";

interface PatternCardProps {
  pattern: Pattern;
}

export function statusBadge(pattern: Pattern) {
  if (pattern.completion_date) {
    return { text: "Finished ✓", classes: "bg-[#EBF2EC] text-[#5F7A63]" };
  }
  if (pattern.wip) {
    return { text: `WIP · ${pattern.wip_pct}%`, classes: "bg-[#FBF5E8] text-[#AE7C2A]" };
  }
  if (pattern.kitted) {
    return { text: "Kitted", classes: "bg-[#FDF4F1] text-[#B36050]" };
  }
  return { text: "Not started", classes: "bg-[#F5EEE8] text-[#6B544D]" };
}

export function PatternCard({ pattern }: PatternCardProps) {
  const badge = statusBadge(pattern);

  return (
    <Link
      href={`/patterns/${pattern.id}`}
      className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
    >
      {/* Thumbnail */}
      <div className="w-[76px] h-[76px] flex-shrink-0 bg-[#F5EEE8] flex items-center justify-center rounded-l-2xl overflow-hidden">
        {pattern.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pattern.cover_photo_url}
            alt={pattern.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-3xl opacity-30">📖</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-3 min-w-0">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate leading-tight">
          {pattern.name}
        </p>
        {(pattern.designer || pattern.company) && (
          <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5 truncate">
            {[pattern.designer, pattern.company].filter(Boolean).join(" · ")}
          </p>
        )}
        <span
          className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full font-nunito text-[10px] font-bold ${badge.classes}`}
        >
          {badge.text}
        </span>
      </div>

      <span className="text-[#C4AFA6] font-bold text-lg flex-shrink-0">›</span>
    </Link>
  );
}
