"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getThreadInventory } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { ThreadCard } from "@/components/threads/ThreadCard";
import { THREAD_MANUFACTURERS } from "@/types";
import type { ThreadInventoryItem } from "@/types";

type ManufacturerFilter = "all" | string;

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<ThreadInventoryItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeManufacturer, setActiveManufacturer] = useState<ManufacturerFilter>("all");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await getThreadInventory(user.id);
      setThreads(data ?? []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!threads) return null;
    let result = threads;

    if (activeManufacturer !== "all") {
      result = result.filter((t) => t.manufacturer === activeManufacturer);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.color_number ?? "").toLowerCase().includes(q) ||
          (t.color_name ?? "").toLowerCase().includes(q) ||
          t.manufacturer.toLowerCase().includes(q)
      );
    }

    // Sort numerically by color number within each manufacturer
    result = [...result].sort((a, b) => {
      if (a.manufacturer !== b.manufacturer) return a.manufacturer.localeCompare(b.manufacturer);
      return (parseInt(a.color_number ?? "0", 10) || 0) - (parseInt(b.color_number ?? "0", 10) || 0);
    });

    return result;
  }, [threads, activeManufacturer, search]);

  // Only show manufacturer tabs that have at least one thread
  const activeManufacturers = useMemo(() => {
    if (!threads) return [];
    const set = new Set(threads.map((t) => t.manufacturer));
    return THREAD_MANUFACTURERS.filter((m) => set.has(m));
  }, [threads]);

  function manufacturerCount(m: ManufacturerFilter) {
    if (!threads) return 0;
    if (m === "all") return threads.length;
    return threads.filter((t) => t.manufacturer === m).length;
  }

  const loading = threads === null;

  return (
    <>
      <TopBar title="My Stash" />
      <PageWrapper className="pb-8">
        {/* Threads / Fabrics switcher */}
        <div
          className="flex rounded-2xl p-1 gap-1 mb-5"
          style={{ backgroundColor: "#EDE5DC" }}
        >
          <div
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl bg-white font-nunito font-bold text-[12px] text-[#3A2418] shadow-sm"
            style={{ boxShadow: "0 1px 4px rgba(58,36,24,0.10)" }}
          >
            <span>🧵</span> Threads
          </div>
          <Link
            href="/fabrics"
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl font-nunito font-bold text-[12px] text-[#B6A090] active:scale-[0.97] transition-transform"
          >
            <span>🪢</span> Fabrics
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B6A090] text-lg select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by number, name, or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6A090] text-xl w-7 h-7 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>

        {/* Manufacturer filter tabs */}
        {!loading && activeManufacturers.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
            {/* All tab */}
            <button
              onClick={() => setActiveManufacturer("all")}
              className={`flex-shrink-0 h-9 px-4 rounded-full font-nunito font-semibold text-[13px] transition-colors ${
                activeManufacturer === "all"
                  ? "bg-[#B36050] text-white"
                  : "bg-white border border-[#E4D6C8] text-[#896E66]"
              }`}
            >
              All
              <span className={`ml-1.5 text-[11px] ${activeManufacturer === "all" ? "opacity-80" : "opacity-60"}`}>
                {manufacturerCount("all")}
              </span>
            </button>
            {activeManufacturers.map((m) => (
              <button
                key={m}
                onClick={() => setActiveManufacturer(m)}
                className={`flex-shrink-0 h-9 px-4 rounded-full font-nunito font-semibold text-[13px] transition-colors ${
                  activeManufacturer === m
                    ? "bg-[#B36050] text-white"
                    : "bg-white border border-[#E4D6C8] text-[#896E66]"
                }`}
              >
                {m}
                <span className={`ml-1.5 text-[11px] ${activeManufacturer === m ? "opacity-80" : "opacity-60"}`}>
                  {manufacturerCount(m)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Stats row when not loading */}
        {!loading && threads!.length > 0 && (
          <p className="font-nunito text-[12px] text-[#B6A090] mb-3">
            {threads!.length} {threads!.length === 1 ? "thread" : "threads"} in your stash
            {activeManufacturer !== "all" && ` · ${filtered!.length} shown`}
          </p>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[72px]" />
            ))}
          </div>
        ) : filtered!.length === 0 ? (
          <EmptyState search={search} manufacturer={activeManufacturer} hasAny={threads!.length > 0} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered!.map((t) => (
              <ThreadCard key={t.id} thread={t} />
            ))}
          </div>
        )}
      </PageWrapper>

      {/* FAB */}
      <Link
        href="/threads/new"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-5 w-14 h-14 rounded-full bg-[#B36050] text-white text-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40 md:bottom-6 md:right-6"
        aria-label="Add thread"
      >
        +
      </Link>
    </>
  );
}

function EmptyState({
  search,
  manufacturer,
  hasAny,
}: {
  search: string;
  manufacturer: ManufacturerFilter;
  hasAny: boolean;
}) {
  if (search) {
    return (
      <div className="flex flex-col items-center text-center py-12 gap-3">
        <span className="text-4xl">🔍</span>
        <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
          No threads match &ldquo;{search}&rdquo;
        </p>
        <p className="font-nunito text-[13px] text-[#896E66]">
          Try a color number, name, or brand.
        </p>
      </div>
    );
  }

  if (manufacturer !== "all" && hasAny) {
    return (
      <div className="flex flex-col items-center text-center py-12 gap-3">
        <span className="text-4xl">🧵</span>
        <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
          No {manufacturer} threads yet
        </p>
        <p className="font-nunito text-[13px] text-[#896E66]">
          Tap + to add your first {manufacturer} thread.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-14 gap-3">
      <span className="text-5xl">🧵</span>
      <p className="font-nunito font-bold text-[16px] text-[#3A2418]">
        Your stash is empty!
      </p>
      <p className="font-nunito text-[13px] text-[#896E66] max-w-[260px]">
        Tap the + button to start adding your threads. Every skein tells a story ✿
      </p>
    </div>
  );
}
