import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-7xl mb-4">🧵</p>
        <h1 className="font-playfair text-[28px] font-bold text-[#3A2418] mb-2">
          Lost stitch!
        </h1>
        <p className="font-nunito text-[15px] text-[#6B544D] mb-8 leading-relaxed">
          We couldn&apos;t find the page you&apos;re looking for. It may have been
          moved or doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-12 px-8 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[15px] items-center justify-center active:scale-[0.98] transition-transform shadow-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
