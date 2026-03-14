"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-sm">
        <p className="text-6xl mb-4">🪡</p>
        <h1 className="font-playfair text-[24px] font-bold text-[#3A2418] mb-2">
          Oops — a dropped stitch!
        </h1>
        <p className="font-nunito text-[14px] text-[#6B544D] mb-6 leading-relaxed">
          Something unexpected happened. Your data is safe — let&apos;s try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-11 px-6 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[14px] items-center justify-center active:scale-[0.98] transition-transform shadow-md"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
