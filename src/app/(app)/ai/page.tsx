"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AdvisorChat } from "@/components/ai/AdvisorChat";
import { PhotoScanner } from "@/components/ai/PhotoScanner";
import type { AIScanThreadResult } from "@/types";

type Tab = "chat" | "scan" | "stash";

export default function AIPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [scanResult, setScanResult] = useState<{ threads: AIScanThreadResult[]; confidence: number } | null>(null);
  const [stashResult, setStashResult] = useState<{ threads: { manufacturer: string; color_number: string; color_name: string | null; quantity: number }[]; confidence: number } | null>(null);

  return (
    <>
      <TopBar title="AI Advisor" />

      {/* Tab switcher */}
      <div className="sticky top-0 z-10 bg-[#FAF6F0] border-b border-[#E4D6C8] px-4 pt-2 pb-0">
        <div className="flex bg-white rounded-xl border border-[#E4D6C8] p-1">
          {([
            { key: "chat" as Tab, label: "🪡 Advisor" },
            { key: "scan" as Tab, label: "📷 Scan" },
            { key: "stash" as Tab, label: "🧵 Stash Import" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-lg font-nunito font-semibold text-[13px] transition-all ${
                tab === key
                  ? "bg-[#B36050] text-white shadow-sm"
                  : "text-[#896E66]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "chat" && (
        <div className="flex-1" style={{ height: "calc(100vh - 180px)" }}>
          <AdvisorChat />
        </div>
      )}

      {tab === "scan" && (
        <div className="px-4 py-5 flex flex-col gap-5 pb-8">
          <PhotoScanner
            mode="colorkey"
            onScanComplete={(result) => setScanResult(result as { threads: AIScanThreadResult[]; confidence: number })}
          />

          {scanResult && (
            <ScanResultPreview
              result={scanResult}
              onClear={() => setScanResult(null)}
            />
          )}
        </div>
      )}

      {tab === "stash" && (
        <div className="px-4 py-5 flex flex-col gap-5 pb-8">
          <PhotoScanner
            mode="stash"
            onScanComplete={(result) => setStashResult(result as { threads: { manufacturer: string; color_number: string; color_name: string | null; quantity: number }[]; confidence: number })}
          />

          {stashResult && (
            <StashResultPreview
              result={stashResult}
              onClear={() => setStashResult(null)}
            />
          )}
        </div>
      )}
    </>
  );
}

// ── Scan Result Preview ──────────────────────────────────────

function ScanResultPreview({
  result,
  onClear,
}: {
  result: { threads: AIScanThreadResult[]; confidence: number };
  onClear: () => void;
}) {
  if (!result.threads || result.threads.length === 0) {
    return (
      <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-4 py-6 text-center">
        <p className="font-nunito text-[13px] text-[#B03020]">
          No threads found in this image. Try a clearer photo of the color key.
        </p>
        <button
          onClick={onClear}
          className="mt-3 font-nunito text-[12px] text-[#896E66] underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
          ✨ Found {result.threads.length} thread{result.threads.length !== 1 ? "s" : ""}
        </p>
        <span className="font-nunito text-[11px] text-[#5F7A63]">
          {Math.round(result.confidence * 100)}% confident
        </span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {result.threads.map((t, i) => (
          <div key={i} className="bg-white/70 rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#E4D6C8] flex-shrink-0 flex items-center justify-center">
              <span className="text-[9px] font-bold font-nunito text-[#896E66]">
                {t.manufacturer?.slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-nunito text-[12px] text-[#3A2418] font-semibold truncate">
                {t.manufacturer} {t.color_number}
              </p>
              {t.color_name && (
                <p className="font-nunito text-[11px] text-[#896E66] truncate">{t.color_name}</p>
              )}
            </div>
            <span className="font-nunito text-[11px] text-[#896E66]">
              {t.skeins_needed || 1} sk
            </span>
          </div>
        ))}
      </div>

      <p className="font-nunito text-[12px] text-[#896E66] text-center">
        To add these to a pattern, open the pattern and use &ldquo;Scan Color Key&rdquo; from the thread list.
      </p>

      <button
        onClick={onClear}
        className="w-full h-10 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98]"
      >
        Clear results
      </button>
    </div>
  );
}

// ── Stash Result Preview ──────────────────────────────────────

function StashResultPreview({
  result,
  onClear,
}: {
  result: {
    threads: { manufacturer: string; color_number: string; color_name: string | null; quantity: number }[];
    confidence: number;
  };
  onClear: () => void;
}) {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  async function handleImport() {
    setImporting(true);
    try {
      // Import directly using the Supabase client
      const { createClient } = await import("@/lib/supabase/client");
      const { createThreadInventoryItem } = await import("@/lib/supabase/queries");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const t of result.threads) {
        await createThreadInventoryItem(user.id, {
          manufacturer: t.manufacturer || "DMC",
          color_number: t.color_number || null,
          color_name: t.color_name || null,
          quantity: t.quantity || 1,
          thread_type: "cotton",
          notes: "Added via AI stash scan",
        });
      }
      setImported(true);
    } catch {
      // Silently fail — threads may partially import
    } finally {
      setImporting(false);
    }
  }

  if (!result.threads || result.threads.length === 0) {
    return (
      <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-4 py-6 text-center">
        <p className="font-nunito text-[13px] text-[#B03020]">
          No threads found in this image. Try a clearer photo of your thread labels or organizer.
        </p>
        <button onClick={onClear} className="mt-3 font-nunito text-[12px] text-[#896E66] underline">
          Try again
        </button>
      </div>
    );
  }

  if (imported) {
    return (
      <div className="bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-2xl px-4 py-6 text-center flex flex-col gap-2">
        <span className="text-3xl">✅</span>
        <p className="font-nunito font-bold text-[14px] text-[#5F7A63]">
          {result.threads.length} thread{result.threads.length !== 1 ? "s" : ""} added to your stash!
        </p>
        <button onClick={onClear} className="mt-2 font-nunito text-[12px] text-[#896E66] underline">
          Scan more
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
          🧵 Found {result.threads.length} thread{result.threads.length !== 1 ? "s" : ""}
        </p>
        <span className="font-nunito text-[11px] text-[#AE7C2A]">
          {Math.round(result.confidence * 100)}% confident
        </span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {result.threads.map((t, i) => (
          <div key={i} className="bg-white/70 rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#E4D6C8] flex-shrink-0 flex items-center justify-center">
              <span className="text-[9px] font-bold font-nunito text-[#896E66]">
                {t.manufacturer?.slice(0, 2)}
              </span>
            </div>
            <p className="font-nunito text-[12px] text-[#3A2418] font-semibold flex-1 truncate">
              {t.manufacturer} {t.color_number}
              {t.color_name ? ` · ${t.color_name}` : ""}
            </p>
            <span className="font-nunito text-[11px] text-[#896E66] font-semibold">
              ×{t.quantity || 1}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleImport}
        disabled={importing}
        className="w-full h-12 rounded-full bg-[#5F7A63] text-white font-nunito font-bold text-[14px] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
      >
        {importing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Adding to stash...
          </>
        ) : (
          <>Add all to my stash 🧵</>
        )}
      </button>

      <button
        onClick={onClear}
        className="w-full h-10 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98]"
      >
        Cancel
      </button>
    </div>
  );
}
