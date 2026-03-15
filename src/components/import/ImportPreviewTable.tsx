"use client";

import type { ImportedThread, ImportedPattern } from "@/lib/csv-import";

// ── Thread Preview Table ─────────────────────────────────────

interface ThreadPreviewProps {
  items: ImportedThread[];
  onToggle: (index: number) => void;
  onToggleAll: (selected: boolean) => void;
}

export function ThreadPreviewTable({ items, onToggle, onToggleAll }: ThreadPreviewProps) {
  const selectedCount = items.filter((i) => i.selected).length;
  const duplicateCount = items.filter((i) => i.duplicate).length;
  const newCount = items.filter((i) => !i.duplicate).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <p className="font-nunito text-[13px] text-[#3A2418]">
          <span className="font-bold">{items.length}</span> thread{items.length !== 1 ? "s" : ""} found
          {duplicateCount > 0 && (
            <span className="text-[#6B544D]">
              {" "}· <span className="text-[#AE7C2A]">{duplicateCount} already in stash</span>
            </span>
          )}
          {newCount > 0 && (
            <span className="text-[#6B544D]">
              {" "}· <span className="text-[#5F7A63]">{newCount} new</span>
            </span>
          )}
        </p>
        <button
          onClick={() => onToggleAll(selectedCount < items.length)}
          className="font-nunito text-[12px] text-[#B36050] font-semibold"
        >
          {selectedCount === items.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Thread list */}
      <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto overscroll-contain rounded-xl border border-[#E4D6C8] bg-white p-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
              item.selected
                ? "bg-[#FDF4F1] border border-[#F0C8BB]"
                : "bg-[#FAF6F0] border border-transparent opacity-60"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${
                item.selected
                  ? "bg-[#B36050] border-[#B36050]"
                  : "bg-white border-[#E4D6C8]"
              }`}
            >
              {item.selected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Manufacturer badge */}
            <div className="w-8 h-8 rounded bg-[#E4D6C8] flex-shrink-0 flex items-center justify-center">
              <span className="text-[9px] font-bold font-nunito text-[#6B544D]">
                {item.manufacturer.slice(0, 3)}
              </span>
            </div>

            {/* Thread info */}
            <div className="flex-1 min-w-0">
              <p className="font-nunito text-[13px] font-semibold text-[#3A2418] truncate">
                {item.manufacturer} {item.color_number}
              </p>
              {item.color_name && (
                <p className="font-nunito text-[11px] text-[#6B544D] truncate">{item.color_name}</p>
              )}
            </div>

            {/* Quantity */}
            <span className="font-nunito text-[12px] text-[#6B544D] font-semibold flex-shrink-0">
              ×{item.quantity}
            </span>

            {/* Duplicate badge */}
            {item.duplicate && (
              <span className="font-nunito text-[10px] text-[#AE7C2A] bg-[#FBF5E8] px-1.5 py-0.5 rounded-full flex-shrink-0">
                In stash
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="font-nunito text-[12px] text-[#6B544D] text-center">
        {selectedCount} thread{selectedCount !== 1 ? "s" : ""} selected for import
      </p>
    </div>
  );
}

// ── Pattern Preview Table ────────────────────────────────────

interface PatternPreviewProps {
  items: ImportedPattern[];
  onToggle: (index: number) => void;
  onToggleAll: (selected: boolean) => void;
}

export function PatternPreviewTable({ items, onToggle, onToggleAll }: PatternPreviewProps) {
  const selectedCount = items.filter((i) => i.selected).length;
  const duplicateCount = items.filter((i) => i.duplicate).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <p className="font-nunito text-[13px] text-[#3A2418]">
          <span className="font-bold">{items.length}</span> pattern{items.length !== 1 ? "s" : ""} found
          {duplicateCount > 0 && (
            <span className="text-[#AE7C2A]"> · {duplicateCount} may be duplicates</span>
          )}
        </p>
        <button
          onClick={() => onToggleAll(selectedCount < items.length)}
          className="font-nunito text-[12px] text-[#B36050] font-semibold"
        >
          {selectedCount === items.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Pattern list */}
      <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto overscroll-contain rounded-xl border border-[#E4D6C8] bg-white p-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
              item.selected
                ? "bg-[#FDF4F1] border border-[#F0C8BB]"
                : "bg-[#FAF6F0] border border-transparent opacity-60"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${
                item.selected
                  ? "bg-[#B36050] border-[#B36050]"
                  : "bg-white border-[#E4D6C8]"
              }`}
            >
              {item.selected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Pattern icon */}
            <div className="w-8 h-8 rounded bg-[#F0C8BB] flex-shrink-0 flex items-center justify-center">
              <span className="text-sm">📖</span>
            </div>

            {/* Pattern info */}
            <div className="flex-1 min-w-0">
              <p className="font-nunito text-[13px] font-semibold text-[#3A2418] truncate">
                {item.name}
              </p>
              {item.designer && (
                <p className="font-nunito text-[11px] text-[#6B544D] truncate">
                  by {item.designer}
                  {item.company ? ` · ${item.company}` : ""}
                </p>
              )}
            </div>

            {/* Duplicate badge */}
            {item.duplicate && (
              <span className="font-nunito text-[10px] text-[#AE7C2A] bg-[#FBF5E8] px-1.5 py-0.5 rounded-full flex-shrink-0">
                May exist
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="font-nunito text-[12px] text-[#6B544D] text-center">
        {selectedCount} pattern{selectedCount !== 1 ? "s" : ""} selected for import
      </p>
    </div>
  );
}
