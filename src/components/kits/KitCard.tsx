"use client";

import Link from "next/link";
import type { Pattern } from "@/types";

interface KitCardProps {
  kit: Pattern;
}

function kitStatusBadge(kit: Pattern): { text: string; classes: string } {
  if (kit.kit_status === "finished" || kit.completion_date) {
    return { text: "Finished ✓", classes: "bg-[#EBF2EC] text-[#5F7A63]" };
  }
  if (kit.kit_status === "started") {
    const pct = kit.wip_pct ?? 0;
    return {
      text: pct > 0 ? `Started · ${pct}%` : "Started 🪡",
      classes: "bg-[#FBF5E8] text-[#AE7C2A]",
    };
  }
  return { text: "Unopened 📦", classes: "bg-[#F5EEE8] text-[#6B544D]" };
}

function kitTypeLabel(type: string) {
  if (type === "kit_embroidery") return "Embroidery";
  return "Cross Stitch";
}

export function KitCard({ kit }: KitCardProps) {
  const badge = kitStatusBadge(kit);

  return (
    <Link
      href={`/kits/${kit.id}`}
      className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
    >
      {/* Thumbnail */}
      <div className="w-[76px] h-[76px] flex-shrink-0 bg-[#F5EEE8] flex items-center justify-center rounded-l-2xl overflow-hidden">
        {kit.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kit.cover_photo_url}
            alt={kit.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-3xl opacity-30">🧺</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-3 min-w-0">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate leading-tight">
          {kit.name}
        </p>
        <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5 truncate">
          {[kit.company, kitTypeLabel(kit.type)].filter(Boolean).join(" · ")}
        </p>
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
