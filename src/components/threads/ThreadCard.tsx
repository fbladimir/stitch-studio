"use client";

import Link from "next/link";
import type { ThreadInventoryItem } from "@/types";

interface ThreadCardProps {
  thread: ThreadInventoryItem;
}

function threadTypeBadge(type: ThreadInventoryItem["thread_type"]): string {
  const map: Record<string, string> = {
    cotton: "Cotton",
    silk: "Silk",
    rayon: "Rayon",
    wool: "Wool",
    perle: "Perle",
    blended: "Blended",
    other: "Other",
  };
  return type ? (map[type] ?? type) : "";
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const typeLabel = threadTypeBadge(thread.thread_type);

  return (
    <Link
      href={`/threads/${thread.id}`}
      className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
    >
      {/* Color swatch / icon column */}
      <div className="w-[72px] h-[72px] flex-shrink-0 bg-[#FDF4F1] flex flex-col items-center justify-center rounded-l-2xl gap-1">
        <span className="text-2xl">🧵</span>
        {thread.color_number && (
          <span className="font-nunito font-bold text-[11px] text-[#B36050] leading-none">
            {thread.color_number}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-3 min-w-0">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate leading-tight">
          {thread.color_name ?? thread.color_number ?? "Unnamed thread"}
        </p>
        <p className="font-nunito text-[12px] text-[#896E66] mt-0.5 truncate">
          {[thread.manufacturer, typeLabel].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Quantity badge */}
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
        <span className="w-9 h-9 rounded-full bg-[#FDF4F1] border border-[#F0C8BB] flex items-center justify-center font-nunito font-bold text-[15px] text-[#B36050]">
          {thread.quantity}
        </span>
        <span className="font-nunito text-[9px] text-[#C4AFA6] uppercase tracking-wide">
          {thread.quantity === 1 ? "skein" : "skeins"}
        </span>
      </div>

      <span className="text-[#C4AFA6] font-bold text-lg flex-shrink-0 ml-1">›</span>
    </Link>
  );
}
