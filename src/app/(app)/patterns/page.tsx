"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPatterns } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PatternCard } from "@/components/patterns/PatternCard";
import type { Pattern } from "@/types";

type FilterTab = "all" | "wip" | "kitted" | "finished";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "wip", label: "WIP" },
  { id: "kitted", label: "Kitted" },
  { id: "finished", label: "Finished" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

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

    return result;
  }, [patterns, activeTab, search]);

  const loading = patterns === null;
  const totalCount = patterns?.length ?? 0;

  return (
    <>
      <TopBar title="My Patterns" />
      <PageWrapper className="pb-8">
        {/* Collection switcher — Patterns / Kits */}
        <div
          className="flex rounded-2xl p-1 gap-1 mb-5"
          style={{ backgroundColor: "#EDE5DC" }}
        >
          <div className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white font-nunito font-bold text-[13px] text-[#3A2418] shadow-sm"
            style={{ boxShadow: "0 1px 4px rgba(58,36,24,0.10)" }}
          >
            <span>📖</span> Patterns
          </div>
          <Link
            href="/kits"
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl font-nunito font-bold text-[13px] text-[#B6A090] active:scale-[0.97] transition-transform"
          >
            <span>🧺</span> Kits
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B6A090] text-lg select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search patterns, designers…"
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
                    : "bg-white border border-[#E4D6C8] text-[#896E66]"
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
        <p className="font-nunito text-[13px] text-[#896E66]">
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
      <p className="font-nunito text-[13px] text-[#896E66] max-w-[260px]">{body}</p>
    </div>
  );
}
