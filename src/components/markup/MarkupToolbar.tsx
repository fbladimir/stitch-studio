"use client";

import type { MarkupTool } from "./GridCanvas";

interface MarkupToolbarProps {
  tool: MarkupTool;
  onToolChange: (tool: MarkupTool) => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  canUndo: boolean;
  saving: boolean;
}

const TOOLS: { id: MarkupTool; icon: string; label: string }[] = [
  { id: "mark", icon: "✏️", label: "Mark" },
  { id: "erase", icon: "🧹", label: "Erase" },
  { id: "pan", icon: "🤚", label: "Move" },
];

export function MarkupToolbar({
  tool,
  onToolChange,
  onUndo,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  canUndo,
  saving,
}: MarkupToolbarProps) {
  return (
    <div className="bg-white border-t border-[#E4D6C8] px-3 py-2 flex items-center gap-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
      {/* Tool selector */}
      <div className="flex bg-[#F5EEE8] rounded-xl p-1 gap-0.5">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={`h-10 px-3 rounded-lg flex items-center gap-1.5 font-nunito text-[12px] font-bold transition-all ${
              tool === t.id
                ? "bg-white shadow-sm text-[#3A2418]"
                : "text-[#6B544D]"
            }`}
          >
            <span className="text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-10 h-10 rounded-xl bg-[#F5EEE8] flex items-center justify-center text-sm disabled:opacity-30 active:scale-90 transition-transform"
        aria-label="Undo"
      >
        ↩️
      </button>

      {/* Zoom controls */}
      <button
        onClick={onZoomOut}
        className="w-10 h-10 rounded-xl bg-[#F5EEE8] flex items-center justify-center font-bold text-[#6B544D] text-lg active:scale-90 transition-transform"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={onFitToScreen}
        className="w-10 h-10 rounded-xl bg-[#F5EEE8] flex items-center justify-center text-sm active:scale-90 transition-transform"
        aria-label="Fit to screen"
      >
        ⊞
      </button>
      <button
        onClick={onZoomIn}
        className="w-10 h-10 rounded-xl bg-[#F5EEE8] flex items-center justify-center font-bold text-[#6B544D] text-lg active:scale-90 transition-transform"
        aria-label="Zoom in"
      >
        +
      </button>

      {/* Save indicator */}
      {saving && (
        <div className="w-6 h-6 border-2 border-[#F0C8BB] border-t-[#B36050] rounded-full animate-spin" />
      )}
    </div>
  );
}
