"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🪡</div>
      <h1 className="font-playfair text-[24px] font-bold text-[#3A2418] mb-2">
        You&apos;re offline
      </h1>
      <p className="font-nunito text-[15px] text-[#896E66] max-w-[300px] leading-relaxed">
        It looks like you&apos;ve lost your connection. Don&apos;t worry — your stitching data is safe!
        Reconnect to the internet and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 h-12 px-8 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md"
      >
        Try Again
      </button>
    </div>
  );
}
