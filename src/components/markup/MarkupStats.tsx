"use client";

interface MarkupStatsProps {
  markedCount: number;
  totalCells: number;
}

export function MarkupStats({ markedCount, totalCells }: MarkupStatsProps) {
  const pct = totalCells > 0 ? Math.round((markedCount / totalCells) * 100) : 0;
  const remaining = Math.max(0, totalCells - markedCount);

  return (
    <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E4D6C8] px-3 py-2 shadow-md">
      {/* Mini progress bar */}
      <div className="w-12 h-12 relative flex-shrink-0">
        <svg width="48" height="48" className="-rotate-90">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#F5EEE8" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke={pct >= 100 ? "#5F7A63" : "#B36050"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
            className="transition-all duration-300"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-nunito text-[10px] font-bold text-[#3A2418]">
          {pct}%
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-nunito text-[13px] font-bold text-[#3A2418]">
          {markedCount.toLocaleString()} <span className="text-[#6B544D] font-normal">/ {totalCells.toLocaleString()}</span>
        </p>
        <p className="font-nunito text-[10px] text-[#6B544D]">
          {remaining.toLocaleString()} stitches remaining
        </p>
      </div>
    </div>
  );
}
