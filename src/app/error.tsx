"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-7xl mb-4">🪡</p>
        <h1 className="font-playfair text-[28px] font-bold text-[#3A2418] mb-2">
          Something went wrong
        </h1>
        <p className="font-nunito text-[15px] text-[#6B544D] mb-8 leading-relaxed">
          Don&apos;t worry, your data is safe. Let&apos;s try that again.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-12 px-8 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[15px] items-center justify-center active:scale-[0.98] transition-transform shadow-md"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
