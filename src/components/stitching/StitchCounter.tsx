"use client";

interface StitchCounterProps {
  count: number;
  onChange: (count: number) => void;
}

const QUICK_ADD = [10, 50, 100];

export function StitchCounter({ count, onChange }: StitchCounterProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <label className="font-nunito text-[12px] font-semibold text-[#6B544D] uppercase tracking-wider">
        Stitches This Session
      </label>

      {/* Big number display */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, count - 10))}
          className="w-11 h-11 rounded-full bg-white border-2 border-[#E4D6C8] text-[#6B544D] font-bold text-lg active:scale-90 transition-transform"
        >
          −
        </button>

        <input
          type="number"
          min={0}
          value={count || ""}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-24 h-14 text-center font-playfair text-[28px] font-bold text-[#3A2418] bg-white border-2 border-[#E4D6C8] rounded-2xl focus:outline-none focus:border-[#B36050] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button
          onClick={() => onChange(count + 10)}
          className="w-11 h-11 rounded-full bg-white border-2 border-[#E4D6C8] text-[#6B544D] font-bold text-lg active:scale-90 transition-transform"
        >
          +
        </button>
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {QUICK_ADD.map((n) => (
          <button
            key={n}
            onClick={() => onChange(count + n)}
            className="h-9 px-4 rounded-full bg-[#EBF2EC] border border-[#C0D4C2] font-nunito font-bold text-[12px] text-[#5F7A63] active:scale-95 transition-transform"
          >
            +{n}
          </button>
        ))}
      </div>
    </div>
  );
}
