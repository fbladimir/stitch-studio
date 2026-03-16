"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPatterns } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PatternCard } from "@/components/patterns/PatternCard";
import type { Pattern } from "@/types";

type FilterTab = "all" | "wip" | "kitted" | "finished";
type SortOption = "updated" | "name" | "designer" | "newest" | "progress";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "wip", label: "WIP" },
  { id: "kitted", label: "Kitted" },
  { id: "finished", label: "Finished" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "updated", label: "Recently Updated" },
  { id: "name", label: "Pattern Name" },
  { id: "designer", label: "Designer" },
  { id: "newest", label: "Date Added" },
  { id: "progress", label: "Progress %" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function PatternsPage() {
  return (
    <Suspense fallback={
      <>
        <TopBar title="My Patterns" />
        <PageWrapper className="pb-8">
          <div className="flex flex-col gap-3 mt-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[76px]" />
            ))}
          </div>
        </PageWrapper>
      </>
    }>
      <PatternsContent />
    </Suspense>
  );
}

function PatternsContent() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterTab) || "all";

  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [showSort, setShowSort] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>(
    ["all", "wip", "kitted", "finished"].includes(initialFilter) ? initialFilter : "all"
  );

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await getPatterns(user.id);
      setPatterns(data ?? []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!patterns) return null;
    let result = patterns;

    if (activeTab === "wip") {
      result = result.filter((p) => p.wip && !p.completion_date);
    } else if (activeTab === "kitted") {
      result = result.filter((p) => p.kitted && !p.wip && !p.completion_date);
    } else if (activeTab === "finished") {
      result = result.filter((p) => Boolean(p.completion_date));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.designer ?? "").toLowerCase().includes(q) ||
          (p.company ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "designer":
          return (a.designer ?? "").localeCompare(b.designer ?? "");
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "progress":
          return (b.wip_pct ?? 0) - (a.wip_pct ?? 0);
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [patterns, activeTab, search, sortBy]);

  const loading = patterns === null;
  const totalCount = patterns?.length ?? 0;

  return (
    <>
      <TopBar title="My Patterns" />
      <PageWrapper className="pb-8">
        {/* Collection switcher — Patterns / Embroidery / Kits */}
        <div
          className="flex rounded-2xl p-1 gap-1 mb-5"
          style={{ backgroundColor: "#EDE5DC" }}
        >
          <div
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl bg-white font-nunito font-bold text-[12px] text-[#3A2418] shadow-sm"
            style={{ boxShadow: "0 1px 4px rgba(58,36,24,0.10)" }}
          >
            <span>📖</span> Patterns
          </div>
          <Link
            href="/embroidery"
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl font-nunito font-bold text-[12px] text-[#9A8578] active:scale-[0.97] transition-transform"
          >
            <span>🌸</span> Embroidery
          </Link>
          <Link
            href="/kits"
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl font-nunito font-bold text-[12px] text-[#9A8578] active:scale-[0.97] transition-transform"
          >
            <span>🧺</span> Kits
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8578] text-lg select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search patterns, designers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8578] text-xl w-7 h-7 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>

        {/* Sort + Filter row */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-nunito text-[12px] text-[#6B544D] font-semibold">
            {!loading && `${filtered?.length ?? 0} pattern${(filtered?.length ?? 0) !== 1 ? "s" : ""}`}
          </p>
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white border border-[#E4D6C8] font-nunito text-[12px] font-semibold text-[#6B544D] active:scale-[0.97] transition-transform"
            >
              <span className="text-[13px]">↕</span>
              {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSort(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-40 bg-white border border-[#E4D6C8] rounded-2xl py-1.5 min-w-[180px] shadow-lg"
                  style={{ animation: "fadeSlideUp 0.15s ease-out" }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setShowSort(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 font-nunito text-[13px] transition-colors ${
                        sortBy === opt.id
                          ? "text-[#B36050] font-bold bg-[#FDF4F1]"
                          : "text-[#3A2418] active:bg-[#FAF6F0]"
                      }`}
                    >
                      {sortBy === opt.id && <span className="mr-1.5">✓</span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
          {TABS.map((tab) => {
            const count =
              tab.id === "all"
                ? totalCount
                : tab.id === "wip"
                ? (patterns?.filter((p) => p.wip && !p.completion_date).length ?? 0)
                : tab.id === "kitted"
                ? (patterns?.filter((p) => p.kitted && !p.wip && !p.completion_date).length ?? 0)
                : (patterns?.filter((p) => Boolean(p.completion_date)).length ?? 0);

            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 h-9 px-4 rounded-full font-nunito font-semibold text-[13px] transition-colors ${
                  isActive
                    ? "bg-[#B36050] text-white"
                    : "bg-white border border-[#E4D6C8] text-[#6B544D]"
                }`}
              >
                {tab.label}
                {!loading && (
                  <span className={`ml-1.5 text-[11px] ${isActive ? "opacity-80" : "opacity-60"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[76px]" />
            ))}
          </div>
        ) : filtered!.length === 0 ? (
          <EmptyState tab={activeTab} search={search} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered!.map((p) => (
              <PatternCard key={p.id} pattern={p} />
            ))}
          </div>
        )}
      </PageWrapper>

      {/* FAB */}
      <Link
        href="/patterns/new"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-5 w-14 h-14 rounded-full bg-[#B36050] text-white text-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40 md:bottom-6 md:right-6"
        aria-label="Add pattern"
      >
        +
      </Link>
    </>
  );
}

function EmptyState({ tab, search }: { tab: FilterTab; search: string }) {
  if (search) {
    return (
      <div className="flex flex-col items-center text-center py-12 gap-3">
        <span className="text-4xl">🔍</span>
        <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
          No patterns match &ldquo;{search}&rdquo;
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D]">
          Try a different name or designer.
        </p>
      </div>
    );
  }

  const messages: Record<FilterTab, { icon: string; title: string; body: string }> = {
    all: {
      icon: "📖",
      title: "Your collection is empty!",
      body: "Tap the + button below to add your first pattern.",
    },
    wip: {
      icon: "⏱️",
      title: "No WIPs right now",
      body: "Open a pattern and toggle 'Work in Progress' to start tracking.",
    },
    kitted: {
      icon: "🧺",
      title: "Nothing kitted yet",
      body: "Use Kitting Check to see if you have all your supplies.",
    },
    finished: {
      icon: "✅",
      title: "No finished pieces yet",
      body: "Keep stitching — your completed collection will appear here!",
    },
  };

  const { icon, title, body } = messages[tab];

  return (
    <div className="flex flex-col items-center text-center py-12 gap-3">
      <span className="text-5xl">{icon}</span>
      <p className="font-nunito font-bold text-[15px] text-[#3A2418]">{title}</p>
      <p className="font-nunito text-[13px] text-[#6B544D] max-w-[260px]">{body}</p>
    </div>
  );
}
