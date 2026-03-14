"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getPatterns,
  getPatternsForDuplicateCheck,
  getThreadInventory,
  getFabricInventory,
} from "@/lib/supabase/queries";
import { findDuplicates } from "@/lib/duplicate-detection";
import { compressImage, fileToBase64 } from "@/lib/image";
import type {
  Pattern,
  ThreadInventoryItem,
  FabricInventoryItem,
  AIScanCoverResult,
  FabricCount,
  FabricType,
} from "@/types";

// ── Types ──────────────────────────────────────────────────────

type StoreTab = "scan" | "thread" | "fabric" | "list" | "nearby";

type ScanResult =
  | { type: "owned"; pattern: Pattern }
  | { type: "duplicate"; pattern: Pattern; similarity: number }
  | { type: "new"; scanData: AIScanCoverResult }
  | null;

interface NearbyStore {
  name: string;
  address: string;
  distance: string;
  open_now?: boolean;
  place_id: string;
  lat: number;
  lng: number;
}

// ── Main Page ──────────────────────────────────────────────────

export default function StoreModePage() {
  const router = useRouter();
  const [tab, setTab] = useState<StoreTab>("scan");

  // Data loaded once on mount
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [threads, setThreads] = useState<ThreadInventoryItem[]>([]);
  const [fabrics, setFabrics] = useState<FabricInventoryItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [pRes, tRes, fRes] = await Promise.all([
        getPatterns(user.id),
        getThreadInventory(user.id),
        getFabricInventory(user.id),
      ]);

      setPatterns(pRes.data ?? []);
      setThreads(tRes.data ?? []);
      setFabrics(fRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const TABS: { key: StoreTab; icon: string; label: string }[] = [
    { key: "scan", icon: "📷", label: "Scan" },
    { key: "thread", icon: "🧵", label: "Threads" },
    { key: "fabric", icon: "🪢", label: "Fabric" },
    { key: "list", icon: "📋", label: "List" },
    { key: "nearby", icon: "📍", label: "Nearby" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Header — exit button is the full-width top bar */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex-shrink-0 bg-[#B36050] px-4 py-2.5 flex items-center justify-center gap-2 active:bg-[#9A5040] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        <span className="font-nunito font-bold text-[14px] text-white">
          Exit Store Mode
        </span>
      </button>

      <div className="flex-shrink-0 bg-[#3A2418] px-4 py-3">
        <h1 className="font-playfair text-[20px] font-bold text-white text-center">
          🛍️ Store Mode
        </h1>
        <p className="font-nunito text-[11px] text-white/60 mt-0.5 text-center">
          Your in-store shopping assistant
        </p>
      </div>

      {/* Tab bar — large touch targets, high contrast */}
      <div className="flex-shrink-0 bg-[#3A2418] px-2 pb-2">
        <div className="flex gap-1">
          {TABS.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all ${
                tab === key
                  ? "bg-white text-[#3A2418]"
                  : "text-white/70 active:bg-white/10"
              }`}
            >
              <span className="text-[16px]">{icon}</span>
              <span className={`font-nunito text-[10px] font-bold ${
                tab === key ? "text-[#3A2418]" : "text-white/70"
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto bg-[#FAF6F0]"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-3 border-[#E4D6C8] border-t-[#B36050] rounded-full animate-spin" />
            <p className="font-nunito text-[13px] text-[#6B544D]">Loading your stash...</p>
          </div>
        ) : (
          <>
            {tab === "scan" && (
              <ChartScanner userId={userId!} patterns={patterns} />
            )}
            {tab === "thread" && (
              <QuickThreadCheck threads={threads} />
            )}
            {tab === "fabric" && (
              <QuickFabricCheck fabrics={fabrics} />
            )}
            {tab === "list" && (
              <ShoppingList patterns={patterns} threads={threads} />
            )}
            {tab === "nearby" && (
              <NearbyStores />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. CHART SCANNER
// ════════════════════════════════════════════════════════════════

function ChartScanner({ userId, patterns }: { userId: string; patterns: Pattern[] }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);

      const res = await fetch("/api/ai/scan-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("Scan failed");
      const scanData: AIScanCoverResult = await res.json();

      if (!scanData.name) {
        setError("Could not read the pattern name. Try a clearer photo.");
        return;
      }

      // Check for duplicates against existing collection
      const { data: existing } = await getPatternsForDuplicateCheck(userId);

      if (existing) {
        // Exact match first
        const exactMatch = patterns.find(
          (p) => p.name.toLowerCase().trim() === scanData.name!.toLowerCase().trim()
        );

        if (exactMatch) {
          setResult({ type: "owned", pattern: exactMatch });
          return;
        }

        // Fuzzy match
        const dupes = findDuplicates(
          scanData.name,
          scanData.designer ?? null,
          existing
        );

        if (dupes.length > 0) {
          const matchedPattern = patterns.find((p) => p.id === dupes[0].id);
          if (matchedPattern) {
            setResult({ type: "duplicate", pattern: matchedPattern, similarity: dupes[0].similarity });
            return;
          }
        }
      }

      // New pattern
      setResult({ type: "new", scanData });
    } catch {
      setError("Could not scan this photo. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="text-center">
        <p className="font-playfair font-bold text-[20px] text-[#3A2418]">
          Scan a Chart
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
          Photograph a pattern on the shelf to check if you own it
        </p>
      </div>

      {/* No result yet — show scan buttons */}
      {!result && !scanning && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full h-16 rounded-2xl bg-[#3A2418] text-white font-nunito font-bold text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg"
          >
            📷 Take Photo of Chart
          </button>
          <button
            onClick={() => libraryRef.current?.click()}
            className="w-full h-14 rounded-2xl border-2 border-[#3A2418] text-[#3A2418] font-nunito font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            🖼️ Choose from Library
          </button>
        </div>
      )}

      {/* Scanning */}
      {scanning && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-12 h-12 border-4 border-[#E4D6C8] border-t-[#B36050] rounded-full animate-spin" />
          <p className="font-nunito font-bold text-[16px] text-[#3A2418]">
            Checking your collection...
          </p>
          <p className="font-nunito text-[13px] text-[#6B544D]">
            Reading the chart cover
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-5 py-4 text-center">
          <p className="font-nunito text-[14px] text-[#B03020]">{error}</p>
          <button
            onClick={reset}
            className="mt-3 font-nunito text-[13px] text-[#6B544D] underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Result: Already owned */}
      {result?.type === "owned" && (
        <div className="bg-[#EBF2EC] border-2 border-[#5F7A63] rounded-2xl px-5 py-6 flex flex-col items-center gap-3">
          <span className="text-5xl">✅</span>
          <p className="font-playfair font-bold text-[20px] text-[#5F7A63] text-center">
            You already have this!
          </p>
          <p className="font-nunito text-[15px] text-[#3A2418] text-center font-semibold">
            {result.pattern.name}
          </p>
          {result.pattern.designer && (
            <p className="font-nunito text-[13px] text-[#6B544D]">
              by {result.pattern.designer}
            </p>
          )}
          {result.pattern.cover_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.pattern.cover_photo_url}
              alt={result.pattern.name}
              className="w-32 h-32 rounded-xl object-cover border border-[#E4D6C8]"
              loading="lazy"
            />
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-3 py-1 rounded-full font-nunito text-[12px] font-bold ${
              result.pattern.completion_date
                ? "bg-[#5F7A63] text-white"
                : result.pattern.wip
                ? "bg-[#AE7C2A] text-white"
                : result.pattern.kitted
                ? "bg-[#B36050] text-white"
                : "bg-[#E4D6C8] text-[#3A2418]"
            }`}>
              {result.pattern.completion_date
                ? "Finished ✓"
                : result.pattern.wip
                ? `WIP · ${result.pattern.wip_pct}%`
                : result.pattern.kitted
                ? "Kitted"
                : "Not started"}
            </span>
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Link
              href={`/patterns/${result.pattern.id}`}
              className="flex-1 h-12 rounded-full bg-[#3A2418] text-white font-nunito font-bold text-[14px] flex items-center justify-center active:scale-[0.98]"
            >
              View Details
            </Link>
            <button
              onClick={reset}
              className="flex-1 h-12 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[14px] active:scale-[0.98]"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Result: Possible duplicate */}
      {result?.type === "duplicate" && (
        <div className="bg-[#FBF5E8] border-2 border-[#AE7C2A] rounded-2xl px-5 py-6 flex flex-col items-center gap-3">
          <span className="text-5xl">⚠️</span>
          <p className="font-playfair font-bold text-[20px] text-[#AE7C2A] text-center">
            This might be a duplicate
          </p>
          <p className="font-nunito text-[14px] text-[#3A2418] text-center">
            You may already have a similar pattern:
          </p>
          <div className="bg-white rounded-xl px-4 py-3 w-full flex items-center gap-3">
            {result.pattern.cover_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.pattern.cover_photo_url}
                alt={result.pattern.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate">
                {result.pattern.name}
              </p>
              {result.pattern.designer && (
                <p className="font-nunito text-[12px] text-[#6B544D]">
                  {result.pattern.designer}
                </p>
              )}
              <p className="font-nunito text-[11px] text-[#AE7C2A] mt-0.5">
                {Math.round(result.similarity * 100)}% match
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Link
              href={`/patterns/${result.pattern.id}`}
              className="flex-1 h-12 rounded-full bg-[#AE7C2A] text-white font-nunito font-bold text-[14px] flex items-center justify-center active:scale-[0.98]"
            >
              View Existing
            </Link>
            <button
              onClick={reset}
              className="flex-1 h-12 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[14px] active:scale-[0.98]"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Result: New pattern */}
      {result?.type === "new" && (
        <div className="bg-[#FDF4F1] border-2 border-[#B36050] rounded-2xl px-5 py-6 flex flex-col items-center gap-3">
          <span className="text-5xl">🆕</span>
          <p className="font-playfair font-bold text-[20px] text-[#B36050] text-center">
            New to your collection!
          </p>
          <div className="bg-white rounded-xl px-4 py-3 w-full">
            <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
              {result.scanData.name}
            </p>
            {result.scanData.designer && (
              <p className="font-nunito text-[13px] text-[#6B544D] mt-0.5">
                by {result.scanData.designer}
              </p>
            )}
            {result.scanData.company && (
              <p className="font-nunito text-[12px] text-[#6B544D]">
                {result.scanData.company}
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Link
              href="/patterns/new"
              className="flex-1 h-12 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[14px] flex items-center justify-center active:scale-[0.98]"
            >
              Add to Collection
            </Link>
            <button
              onClick={reset}
              className="flex-1 h-12 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[14px] active:scale-[0.98]"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
      <input ref={libraryRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. QUICK THREAD CHECK
// ════════════════════════════════════════════════════════════════

function QuickThreadCheck({ threads }: { threads: ThreadInventoryItem[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.toLowerCase().trim();
  const results = q
    ? threads
        .filter(
          (t) =>
            (t.color_number ?? "").toLowerCase().includes(q) ||
            (t.color_name ?? "").toLowerCase().includes(q) ||
            t.manufacturer.toLowerCase().includes(q)
        )
        .sort((a, b) => {
          if (a.manufacturer !== b.manufacturer) return a.manufacturer.localeCompare(b.manufacturer);
          return (parseInt(a.color_number ?? "0", 10) || 0) - (parseInt(b.color_number ?? "0", 10) || 0);
        })
    : [];

  const hasResults = q && results.length > 0;
  const noResults = q && results.length === 0;

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="text-center">
        <p className="font-playfair font-bold text-[20px] text-[#3A2418]">
          Quick Thread Check
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
          Type a thread number or name to check your stash
        </p>
      </div>

      {/* Search input — extra large for store */}
      <input
        ref={inputRef}
        type="text"
        placeholder="e.g. 304 or Christmas Red"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-14 px-5 rounded-2xl border-2 border-[#3A2418] bg-white font-nunito text-[18px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#9A8578] text-center"
        autoComplete="off"
      />

      {/* Results */}
      {hasResults && (
        <div className="flex flex-col gap-2">
          <p className="font-nunito font-bold text-[14px] text-[#5F7A63]">
            ✅ Found in your stash:
          </p>
          {results.map((t) => (
            <div
              key={t.id}
              className="bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#5F7A63]/10 flex items-center justify-center flex-shrink-0">
                <span className="font-nunito font-bold text-[11px] text-[#5F7A63]">
                  {t.manufacturer.slice(0, 3)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
                  {t.manufacturer} {t.color_number}
                </p>
                {t.color_name && (
                  <p className="font-nunito text-[13px] text-[#6B544D]">{t.color_name}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-playfair font-bold text-[22px] text-[#5F7A63]">
                  {t.quantity}
                </p>
                <p className="font-nunito text-[10px] text-[#6B544D] uppercase">
                  skein{t.quantity !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-5 py-6 text-center">
          <span className="text-4xl">❌</span>
          <p className="font-nunito font-bold text-[16px] text-[#B03020] mt-2">
            Not in your stash
          </p>
          <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
            No threads matching &ldquo;{query}&rdquo; found in your inventory
          </p>
        </div>
      )}

      {/* Stash summary */}
      {!q && (
        <div className="bg-white border border-[#E4D6C8] rounded-2xl px-4 py-4 text-center">
          <p className="font-nunito text-[14px] text-[#6B544D]">
            You have <span className="font-bold text-[#3A2418]">{threads.length}</span> thread{threads.length !== 1 ? "s" : ""} in your stash
          </p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. QUICK FABRIC CHECK
// ════════════════════════════════════════════════════════════════

function QuickFabricCheck({ fabrics }: { fabrics: FabricInventoryItem[] }) {
  const [filterType, setFilterType] = useState<FabricType | "all">("all");
  const [filterCount, setFilterCount] = useState<FabricCount | "all">("all");

  const TYPES: { id: FabricType | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "aida", label: "Aida" },
    { id: "linen", label: "Linen" },
    { id: "evenweave", label: "Evenweave" },
    { id: "other", label: "Other" },
  ];

  const COUNTS: (FabricCount | "all")[] = ["all", "14", "16", "18", "25", "28", "32", "36"];

  const filtered = fabrics.filter((f) => {
    if (filterType !== "all" && f.fabric_type !== filterType) return false;
    if (filterCount !== "all" && f.count !== filterCount) return false;
    return true;
  });

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="text-center">
        <p className="font-playfair font-bold text-[20px] text-[#3A2418]">
          Quick Fabric Check
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
          Filter by type and count to see what you have
        </p>
      </div>

      {/* Type filter */}
      <div>
        <p className="font-nunito font-bold text-[12px] text-[#6B544D] uppercase tracking-wide mb-2">
          Fabric Type
        </p>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilterType(id)}
              className={`h-10 px-4 rounded-full font-nunito font-semibold text-[13px] border transition-colors ${
                filterType === id
                  ? "bg-[#3A2418] border-[#3A2418] text-white"
                  : "bg-white border-[#E4D6C8] text-[#6B544D]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count filter */}
      <div>
        <p className="font-nunito font-bold text-[12px] text-[#6B544D] uppercase tracking-wide mb-2">
          Count
        </p>
        <div className="flex gap-2 flex-wrap">
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCount(c)}
              className={`h-10 px-4 rounded-full font-nunito font-semibold text-[13px] border transition-colors ${
                filterCount === c
                  ? "bg-[#3A2418] border-[#3A2418] text-white"
                  : "bg-white border-[#E4D6C8] text-[#6B544D]"
              }`}
            >
              {c === "all" ? "All" : `${c}ct`}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-nunito font-bold text-[14px] text-[#5F7A63]">
            ✅ {filtered.length} fabric{filtered.length !== 1 ? "s" : ""} in your stash:
          </p>
          {filtered.map((f) => (
            <div
              key={f.id}
              className="bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              {f.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.photo_url}
                  alt={f.color_name || "Fabric"}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#5F7A63]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🪢</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate">
                  {f.color_name || f.manufacturer || "Fabric"}
                </p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {f.fabric_type && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-nunito font-bold text-[#6B544D] capitalize">
                      {f.fabric_type}
                    </span>
                  )}
                  {f.count && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-nunito font-bold text-[#6B544D]">
                      {f.count}ct
                    </span>
                  )}
                  {f.size && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-nunito font-bold text-[#6B544D]">
                      {f.size}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-5 py-6 text-center">
          <span className="text-4xl">❌</span>
          <p className="font-nunito font-bold text-[15px] text-[#B03020] mt-2">
            No matching fabric
          </p>
          <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
            {fabrics.length === 0
              ? "You haven't added any fabric to your stash yet"
              : "No fabric matches your current filters"}
          </p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. SHOPPING LIST
// ════════════════════════════════════════════════════════════════

function ShoppingList({
  patterns,
  threads,
}: {
  patterns: Pattern[];
  threads: ThreadInventoryItem[];
}) {
  // Build shopping list from all kitted patterns that still have missing threads
  const [loading, setLoading] = useState(true);
  const [missingItems, setMissingItems] = useState<
    { patternName: string; manufacturer: string; color_number: string; color_name: string }[]
  >([]);

  useEffect(() => {
    async function buildList() {
      const supabase = createClient();
      // Get all pattern threads for non-finished patterns
      const activePatterns = patterns.filter((p) => !p.completion_date);

      const allMissing: typeof missingItems = [];

      for (const pattern of activePatterns) {
        const { data: patternThreads } = await supabase
          .from("pattern_threads")
          .select("manufacturer, color_number, color_name")
          .eq("pattern_id", pattern.id);

        if (patternThreads) {
          for (const pt of patternThreads) {
            const inStash = threads.some(
              (t) =>
                t.manufacturer.toLowerCase() === (pt.manufacturer ?? "").toLowerCase() &&
                (t.color_number ?? "").toLowerCase() === (pt.color_number ?? "").toLowerCase() &&
                t.quantity > 0
            );

            if (!inStash) {
              // Avoid duplicates in the list
              const alreadyListed = allMissing.some(
                (m) =>
                  m.manufacturer === (pt.manufacturer ?? "") &&
                  m.color_number === (pt.color_number ?? "")
              );

              if (!alreadyListed) {
                allMissing.push({
                  patternName: pattern.name,
                  manufacturer: pt.manufacturer ?? "Unknown",
                  color_number: pt.color_number ?? "",
                  color_name: pt.color_name ?? "",
                });
              }
            }
          }
        }
      }

      // Sort by manufacturer then color number (numeric)
      allMissing.sort((a, b) => {
        if (a.manufacturer !== b.manufacturer) return a.manufacturer.localeCompare(b.manufacturer);
        return (parseInt(a.color_number, 10) || 0) - (parseInt(b.color_number, 10) || 0);
      });

      setMissingItems(allMissing);
      setLoading(false);
    }

    buildList();
  }, [patterns, threads]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-3 border-[#E4D6C8] border-t-[#B36050] rounded-full animate-spin" />
        <p className="font-nunito text-[13px] text-[#6B544D]">Building your shopping list...</p>
      </div>
    );
  }

  // Group by manufacturer
  const grouped: Record<string, typeof missingItems> = {};
  for (const item of missingItems) {
    if (!grouped[item.manufacturer]) grouped[item.manufacturer] = [];
    grouped[item.manufacturer].push(item);
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="text-center">
        <p className="font-playfair font-bold text-[20px] text-[#3A2418]">
          Shopping List
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
          Threads you need across all your patterns
        </p>
      </div>

      {missingItems.length === 0 ? (
        <div className="bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-2xl px-5 py-8 text-center flex flex-col gap-2">
          <span className="text-4xl">✅</span>
          <p className="font-nunito font-bold text-[16px] text-[#5F7A63]">
            Nothing to buy!
          </p>
          <p className="font-nunito text-[13px] text-[#6B544D]">
            You have all the threads you need, or no patterns have thread lists yet.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#E4D6C8] rounded-xl px-4 py-3 text-center">
            <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
              {missingItems.length} thread{missingItems.length !== 1 ? "s" : ""} to buy
            </p>
          </div>

          {Object.entries(grouped).map(([manufacturer, items]) => (
            <div key={manufacturer}>
              <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-2 px-1">
                {manufacturer} ({items.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#E4D6C8] rounded-xl px-4 py-2.5 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FAF6F0] flex items-center justify-center flex-shrink-0">
                      <span className="font-nunito font-bold text-[10px] text-[#6B544D]">
                        {item.manufacturer.slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
                        {item.color_number}
                      </p>
                      {item.color_name && (
                        <p className="font-nunito text-[11px] text-[#6B544D] truncate">
                          {item.color_name}
                        </p>
                      )}
                    </div>
                    <p className="font-nunito text-[10px] text-[#9A8578] flex-shrink-0">
                      for {item.patternName.length > 15 ? item.patternName.slice(0, 15) + "…" : item.patternName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. NEARBY STORES
// ════════════════════════════════════════════════════════════════

function NearbyStores() {
  const [status, setStatus] = useState<"idle" | "requesting" | "loading" | "done" | "denied" | "error">("idle");
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Your browser does not support location services.");
      return;
    }

    setStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("loading");
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/places/nearby?lat=${latitude}&lng=${longitude}`
          );

          if (!res.ok) {
            throw new Error("Could not find nearby stores");
          }

          const data = await res.json();
          setStores(data.stores || []);
          setStatus("done");
        } catch {
          setStatus("error");
          setErrorMsg("Could not find nearby stores. Please try again.");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("error");
          setErrorMsg("Could not determine your location. Please try again.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function openInMaps(store: NearbyStore) {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(store.name)}&ll=${store.lat},${store.lng}`;
    window.open(url, "_blank");
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="text-center">
        <p className="font-playfair font-bold text-[20px] text-[#3A2418]">
          Nearby Craft Stores
        </p>
        <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
          Find craft and needlework shops near you
        </p>
      </div>

      {/* Idle — ask for location */}
      {status === "idle" && (
        <div className="bg-white border border-[#E4D6C8] rounded-2xl px-5 py-6 text-center flex flex-col gap-3">
          <span className="text-4xl">📍</span>
          <p className="font-nunito text-[14px] text-[#3A2418]">
            We need your location to find nearby stores
          </p>
          <p className="font-nunito text-[12px] text-[#6B544D]">
            Your location is only used for this search and is never saved
          </p>
          <button
            onClick={requestLocation}
            className="w-full h-13 rounded-full bg-[#3A2418] text-white font-nunito font-bold text-[15px] active:scale-[0.98] shadow-md mt-1"
          >
            Find Stores Near Me
          </button>
        </div>
      )}

      {/* Requesting / Loading */}
      {(status === "requesting" || status === "loading") && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-10 h-10 border-3 border-[#E4D6C8] border-t-[#B36050] rounded-full animate-spin" />
          <p className="font-nunito font-semibold text-[14px] text-[#3A2418]">
            {status === "requesting" ? "Requesting location..." : "Finding nearby stores..."}
          </p>
        </div>
      )}

      {/* Denied */}
      {status === "denied" && (
        <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-2xl px-5 py-6 text-center flex flex-col gap-2">
          <span className="text-4xl">🔒</span>
          <p className="font-nunito font-bold text-[15px] text-[#AE7C2A]">
            Location access denied
          </p>
          <p className="font-nunito text-[13px] text-[#6B544D]">
            To find nearby stores, please enable location access in your browser or device settings, then try again.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 font-nunito text-[13px] text-[#B36050] underline font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-5 py-6 text-center flex flex-col gap-2">
          <p className="font-nunito text-[14px] text-[#B03020]">{errorMsg}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 font-nunito text-[13px] text-[#6B544D] underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {status === "done" && (
        <>
          {stores.length === 0 ? (
            <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-2xl px-5 py-6 text-center">
              <p className="font-nunito font-bold text-[15px] text-[#AE7C2A]">
                No craft stores found nearby
              </p>
              <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
                Try searching from a different location
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stores.map((store) => (
                <button
                  key={store.place_id}
                  onClick={() => openInMaps(store)}
                  className="bg-white border border-[#E4D6C8] rounded-xl px-4 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🏪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate">
                      {store.name}
                    </p>
                    <p className="font-nunito text-[12px] text-[#6B544D] truncate">
                      {store.address}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-nunito text-[11px] text-[#6B544D]">
                        {store.distance}
                      </span>
                      {store.open_now !== undefined && (
                        <span className={`font-nunito text-[11px] font-bold ${
                          store.open_now ? "text-[#5F7A63]" : "text-[#B03020]"
                        }`}>
                          {store.open_now ? "Open" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[#C4AFA6] text-lg flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={requestLocation}
            className="w-full h-11 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[13px] active:scale-[0.98]"
          >
            Refresh Results
          </button>
        </>
      )}
    </div>
  );
}
