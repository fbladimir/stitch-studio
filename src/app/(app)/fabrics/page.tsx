"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getFabricInventory } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { FabricCard } from "@/components/fabrics/FabricCard";
import type { FabricInventoryItem, FabricType } from "@/types";

type FilterTab = "all" | FabricType;

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aida", label: "Aida" },
  { id: "linen", label: "Linen" },
  { id: "evenweave", label: "Evenweave" },
  { id: "other", label: "Other" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState<FabricInventoryItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await getFabricInventory(user.id);
      setFabrics(data ?? []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!fabrics) return null;
    let result = fabrics;

    if (activeTab !== "all") {
      result = result.filter((f) => f.fabric_type === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (f) =>
          (f.color_name ?? "").toLowerCase().includes(q) ||
          (f.manufacturer ?? "").toLowerCase().includes(q) ||
          (f.size ?? "").toLowerCase().includes(q) ||
          (f.count ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [fabrics, activeTab, search]);

  function tabCount(tab: FilterTab) {
    if (!fabrics) return 0;
    if (tab === "all") return fabrics.length;
    return fabrics.filter((f) => f.fabric_type === tab).length;
  }

  const loading = fabrics === null;

  return (
    <>
      <TopBar title="My Stash" />
      <PageWrapper className="pb-8">
        {/* Threads / Fabrics switcher */}
        <div
          className="flex rounded-2xl p-1 gap-1 mb-5"
          style={{ backgroundColor: "#EDE5DC" }}
        >
          <Link
            href="/threads"
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl font-nunito font-bold text-[12px] text-[#B6A090] active:scale-[0.97] transition-transform"
          >
            <span>🧵</span> Threads
          </Link>
          <div
            className="flex-1 flex items-center justify-center gap-1 h-10 rounded-xl bg-white font-nunito font-bold text-[12px] text-[#3A2418] shadow-sm"
            style={{ boxShadow: "0 1px 4px rgba(58,36,24,0.10)" }}
          >
            <span>🪢</span> Fabrics
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B6A090] text-lg select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by color, brand, size, or count…"
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

        {/* Filter tabs */}
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

        {/* Stats */}
        {!loading && fabrics!.length > 0 && (
          <p className="font-nunito text-[12px] text-[#B6A090] mb-3">
            {fabrics!.length} {fabrics!.length === 1 ? "piece" : "pieces"} in your stash
            {activeTab !== "all" && ` · ${filtered!.length} shown`}
          </p>
        )}

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
            {filtered!.map((f) => (
              <FabricCard key={f.id} fabric={f} />
            ))}
          </div>
        )}
      </PageWrapper>

      {/* FAB */}
      <Link
        href="/fabrics/new"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-5 w-14 h-14 rounded-full bg-[#B36050] text-white text-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40 md:bottom-6 md:right-6"
        aria-label="Add fabric"
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
          No fabrics match &ldquo;{search}&rdquo;
        </p>
        <p className="font-nunito text-[13px] text-[#896E66]">
          Try a color, brand, size, or count.
        </p>
      </div>
    );
  }

  const messages: Record<FilterTab, { icon: string; title: string; body: string }> = {
    all: {
      icon: "🪢",
      title: "No fabrics yet!",
      body: "Tap the + button to add your first piece of fabric.",
    },
    aida: {
      icon: "🪢",
      title: "No Aida fabric yet",
      body: "Add a piece of Aida to track it here.",
    },
    linen: {
      icon: "🪢",
      title: "No linen yet",
      body: "Add a piece of linen to track it here.",
    },
    evenweave: {
      icon: "🪢",
      title: "No evenweave yet",
      body: "Add a piece of evenweave to track it here.",
    },
    other: {
      icon: "🪢",
      title: "Nothing here yet",
      body: "Tap + to add fabric of any other type.",
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
