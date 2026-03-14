"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🪡</div>
        <h1 className="font-playfair text-3xl font-bold text-[#3A2418]">Dashboard</h1>
        <p className="text-[#896E66] mt-2">Coming soon — Phase 3</p>
      </div>
      <button
        onClick={signOut}
        className="px-6 py-3 rounded-full border border-[#E4D6C8] bg-white text-sm font-semibold text-[#896E66] hover:text-[#B03020] hover:border-[#B03020] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
