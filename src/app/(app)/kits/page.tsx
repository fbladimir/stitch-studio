"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getKits } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { KitCard } from "@/components/kits/KitCard";
import type { Pattern } from "@/types";

type FilterTab = "all" | "unopened" | "started" | "finished";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unopened", label: "Unopened" },
  { id: "started", label: "Started" },
  { id: "finished", label: "Finished" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function KitsPage() {
  const [kits, setKits] = useState<Pattern[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await getKits(user.id);
      setKits(data ?? []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!kits) return null;
    let result = kits;

    if (activeTab === "unopened") {
      result = result.filter(
        (k) => !k.kit_status || k.kit_status === "unopened"
      );
    } else if (activeTab === "started") {
      result = result.filter((k) => k.kit_status === "started");
    } else if (activeTab === "finished") {
      result = result.filter((k) => k.kit_status === "finished");
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          (k.company ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [kits, activeTab, search]);

  function tabCount(tab: FilterTab) {
    if (!kits) return 0;
    if (tab === "all") return kits.length;
    if (tab === "unopened")
      return kits.filter((k) => !k.kit_status || k.kit_status === "unopened").length;
    if (tab === "started")
      return kits.filter((k) => k.kit_status === "started").length;
    return kits.filter((k) => k.kit_status === "finished").length;
  }

  const loading = kits === null;

  return (
    <>
      <TopBar title="My Kits" />
      <PageWrapper className="pb-8">
        {/* Collection switcher — Patterns / Embroidery / Kits */}
        <div
          className="flex rounded-2xl p-1 gap-1 mb-5"
          style={{ backgroundColor: "#EDE5DC" }}
        >
          <Link
            href="/patterns"
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl font-nunito font-bold text-[12px] text-[#9A8578] active:scale-[0.97] transition-transform"
          >
            <span>📖</span> Patterns
          </Link>
          <Link
            href="/embroidery"
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl font-nunito font-bold text-[12px] text-[#9A8578] active:scale-[0.97] transition-transform"
          >
            <span>🌸</span> Embroidery
          </Link>
          <div
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl bg-white font-nunito font-bold text-[12px] text-[#3A2418] shadow-sm"
            style={{ boxShadow: "0 1px 4px rgba(58,36,24,0.10)" }}
          >
            <span>🧺</span> Kits
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8578] text-lg select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search kits or brands…"
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

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
          {TABS.map((tab) => {
            const count = tabCount(tab.id);
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
                  <span
                    className={`ml-1.5 text-[11px] ${
                      isActive ? "opacity-80" : "opacity-60"
                    }`}
                  >
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
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[76px]" />
            ))}
          </div>
        ) : filtered!.length === 0 ? (
          <EmptyState tab={activeTab} search={search} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered!.map((k) => (
              <KitCard key={k.id} kit={k} />
            ))}
          </div>
        )}
      </PageWrapper>

      {/* FAB */}
      <Link
        href="/kits/new"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-5 w-14 h-14 rounded-full bg-[#B36050] text-white text-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40 md:bottom-6 md:right-6"
        aria-label="Add kit"
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
          No kits match &ldquo;{search}&rdquo;
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D]">
          Try a different name or brand.
        </p>
      </div>
    );
  }

  const messages: Record<FilterTab, { icon: string; title: string; body: string }> = {
    all: {
      icon: "🧺",
      title: "No kits yet!",
      body: "Tap the + button to add your first kit.",
    },
    unopened: {
      icon: "📦",
      title: "No unopened kits",
      body: "Kits waiting to be started will appear here.",
    },
    started: {
      icon: "🪡",
      title: "Nothing in progress",
      body: "Open a kit and set its status to Started to track your work.",
    },
    finished: {
      icon: "✅",
      title: "No finished kits yet",
      body: "Keep going — your completed kits will appear here!",
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
