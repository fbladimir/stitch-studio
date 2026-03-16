"use client";

interface DailyTargetRingProps {
  stitchedToday: number;
  target: number;
}

export function DailyTargetRing({ stitchedToday, target }: DailyTargetRingProps) {
  if (target <= 0) return null;

  const pct = Math.min(100, Math.round((stitchedToday / target) * 100));
  const completed = stitchedToday >= target;
  const remaining = Math.max(0, target - stitchedToday);

  // SVG ring params
  const size = 100;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      {/* Ring */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F5EEE8"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={completed ? "#5F7A63" : "#AE7C2A"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-playfair text-[18px] font-bold leading-none ${completed ? "text-[#5F7A63]" : "text-[#AE7C2A]"}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className="font-nunito text-[14px] font-bold text-[#3A2418]">
          {completed ? "Daily target reached! 🎉" : "Today's Progress"}
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D] mt-0.5">
          <span className="font-bold">{stitchedToday.toLocaleString()}</span> / {target.toLocaleString()} stitches
        </p>
        {!completed && (
          <p className="font-nunito text-[11px] text-[#AE7C2A] mt-0.5">
            {remaining.toLocaleString()} to go
          </p>
        )}
      </div>
    </div>
  );
}
