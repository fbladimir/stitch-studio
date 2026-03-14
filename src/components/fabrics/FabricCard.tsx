"use client";

import Link from "next/link";
import type { FabricInventoryItem } from "@/types";

interface FabricCardProps {
  fabric: FabricInventoryItem;
}

function fabricTypeBadge(type: FabricInventoryItem["fabric_type"]): {
  label: string;
  classes: string;
} {
  switch (type) {
    case "aida":
      return { label: "Aida", classes: "bg-[#FDF4F1] text-[#B36050]" };
    case "linen":
      return { label: "Linen", classes: "bg-[#EBF2EC] text-[#5F7A63]" };
    case "evenweave":
      return { label: "Evenweave", classes: "bg-[#FBF5E8] text-[#AE7C2A]" };
    default:
      return { label: "Other", classes: "bg-[#F5EEE8] text-[#6B544D]" };
  }
}

export function FabricCard({ fabric }: FabricCardProps) {
  const badge = fabricTypeBadge(fabric.fabric_type);
  const countLabel = fabric.count ? `${fabric.count} ct` : null;

  return (
    <Link
      href={`/fabrics/${fabric.id}`}
      className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
    >
      {/* Thumbnail */}
      <div className="w-[76px] h-[76px] flex-shrink-0 bg-[#F5EEE8] flex items-center justify-center rounded-l-2xl overflow-hidden">
        {fabric.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fabric.photo_url}
            alt={fabric.color_name ?? "Fabric"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-3xl opacity-30">🪢</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-3 min-w-0">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate leading-tight">
          {fabric.color_name ?? fabric.manufacturer ?? "Unnamed fabric"}
        </p>
        <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5 truncate">
          {[fabric.manufacturer, fabric.size].filter(Boolean).join(" · ")}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full font-nunito text-[10px] font-bold ${badge.classes}`}
          >
            {badge.label}
          </span>
          {countLabel && (
            <span className="inline-block px-2.5 py-0.5 rounded-full font-nunito text-[10px] font-bold bg-[#F5EEE8] text-[#6B544D]">
              {countLabel}
            </span>
          )}
        </div>
      </div>

      <span className="text-[#C4AFA6] font-bold text-lg flex-shrink-0">›</span>
    </Link>
  );
}
