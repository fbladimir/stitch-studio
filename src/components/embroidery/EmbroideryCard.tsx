"use client";

import Link from "next/link";
import type { Pattern } from "@/types";

interface EmbroideryCardProps {
  embroidery: Pattern;
}

function statusBadge(e: Pattern): { text: string; classes: string } {
  if (e.completion_date) {
    return { text: "Finished ✓", classes: "bg-[#EBF2EC] text-[#5F7A63]" };
  }
  if (e.wip) {
    const pct = e.wip_pct ?? 0;
    return {
      text: pct > 0 ? `WIP · ${pct}%` : "In Progress 🌸",
      classes: "bg-[#FBF5E8] text-[#AE7C2A]",
    };
  }
  return { text: "Not Started", classes: "bg-[#F5EEE8] text-[#6B544D]" };
}

export function EmbroideryCard({ embroidery }: EmbroideryCardProps) {
  const badge = statusBadge(embroidery);
  const subtitle = [embroidery.designer, embroidery.company]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/embroidery/${embroidery.id}`}
      className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
    >
      {/* Thumbnail */}
      <div className="w-[76px] h-[76px] flex-shrink-0 bg-[#F5EEE8] flex items-center justify-center rounded-l-2xl overflow-hidden">
        {embroidery.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={embroidery.cover_photo_url}
            alt={embroidery.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-3xl opacity-30">🌸</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-3 min-w-0">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate leading-tight">
          {embroidery.name}
        </p>
        {subtitle && (
          <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5 truncate">
            {subtitle}
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
