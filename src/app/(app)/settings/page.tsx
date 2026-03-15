"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getThreadInventory, getPatterns } from "@/lib/supabase/queries";
import { exportThreadsCSV, exportPatternsCSV } from "@/lib/csv-export";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { ImportWizard } from "@/components/import/ImportWizard";
import type { ImportApp } from "@/lib/csv-import";
import type { ThreadInventoryItem, Pattern } from "@/types";

type ImportMode = {
  app: ImportApp;
  type: "threads" | "patterns";
} | null;

export default function SettingsPage() {
  const [importMode, setImportMode] = useState<ImportMode>(null);
  const [exporting, setExporting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadCount, setThreadCount] = useState(0);
  const [patternCount, setPatternCount] = useState(0);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [threadRes, patternRes] = await Promise.all([
      getThreadInventory(user.id),
      getPatterns(user.id),
    ]);
    setThreadCount(threadRes.data?.length ?? 0);
    setPatternCount(patternRes.data?.length ?? 0);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Export handlers ──────────────────────────────────────
  const handleExportThreads = async () => {
    if (!userId) return;
    setExporting(true);
    try {
      const { data } = await getThreadInventory(userId);
      if (!data || data.length === 0) {
        toast.error("No threads to export");
        return;
      }
      exportThreadsCSV(data as ThreadInventoryItem[]);
      toast.success(`Exported ${data.length} threads`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPatterns = async () => {
    if (!userId) return;
    setExporting(true);
    try {
      const { data } = await getPatterns(userId);
      if (!data || data.length === 0) {
        toast.error("No patterns to export");
        return;
      }
      exportPatternsCSV(data as Pattern[]);
      toast.success(`Exported ${data.length} patterns`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── Import wizard active ─────────────────────────────────
  if (importMode) {
    return (
      <>
        <TopBar title="Import Data" />
        <PageWrapper className="pb-8">
          <div className="pt-4">
            <ImportWizard
              app={importMode.app}
              importType={importMode.type}
              onClose={() => {
                setImportMode(null);
                load(); // Refresh counts
              }}
            />
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <TopBar title="Settings" />
      <PageWrapper className="pb-8">
        <div className="pt-4 flex flex-col gap-6">

          {/* ── Import Section ─────────────────────────────── */}
          <section>
            <h2 className="font-playfair text-lg font-bold text-[#3A2418] mb-1">
              Import from Another App
            </h2>
            <p className="font-nunito text-[13px] text-[#6B544D] mb-4">
              Bring your thread stash or pattern collection from another cross stitch app into Stitch Studio.
            </p>

            <div className="flex flex-col gap-3">
              {/* PatternKeeper */}
              <ImportAppCard
                icon="📱"
                name="PatternKeeper"
                description="Import threads or patterns from PatternKeeper CSV exports"
                onImportThreads={() => setImportMode({ app: "patternkeeper", type: "threads" })}
                onImportPatterns={() => setImportMode({ app: "patternkeeper", type: "patterns" })}
              />

              {/* R-XP */}
              <ImportAppCard
                icon="🖥️"
                name="R-XP"
                description="Import threads or patterns from R-XP CSV exports"
                onImportThreads={() => setImportMode({ app: "rxp", type: "threads" })}
                onImportPatterns={() => setImportMode({ app: "rxp", type: "patterns" })}
              />

              {/* Saga */}
              <ImportAppCard
                icon="🌐"
                name="Saga"
                description="Import threads or patterns from Saga CSV exports"
                onImportThreads={() => setImportMode({ app: "saga", type: "threads" })}
                onImportPatterns={() => setImportMode({ app: "saga", type: "patterns" })}
              />

              {/* Generic CSV */}
              <div className="bg-white rounded-2xl border border-[#E4D6C8] px-4 py-4" style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">📄</span>
                  <div className="flex-1">
                    <h3 className="font-nunito text-[14px] font-bold text-[#3A2418]">Other CSV File</h3>
                    <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5">
                      Have a CSV from a different app? We&apos;ll try to detect the columns automatically.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setImportMode({ app: "patternkeeper", type: "threads" })}
                        className="flex-1 h-10 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-bold text-[#B36050] active:scale-[0.98]"
                      >
                        🧵 Threads
                      </button>
                      <button
                        onClick={() => setImportMode({ app: "patternkeeper", type: "patterns" })}
                        className="flex-1 h-10 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-bold text-[#B36050] active:scale-[0.98]"
                      >
                        📖 Patterns
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Export Section ─────────────────────────────── */}
          <section>
            <h2 className="font-playfair text-lg font-bold text-[#3A2418] mb-1">
              Export Your Data
            </h2>
            <p className="font-nunito text-[13px] text-[#6B544D] mb-4">
              Download your Stitch Studio data as CSV files for backup or sharing.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleExportThreads}
                disabled={exporting || threadCount === 0}
                className="w-full bg-white rounded-2xl border border-[#E4D6C8] px-4 py-4 flex items-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-transform text-left"
                style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}
              >
                <span className="text-2xl">🧵</span>
                <div className="flex-1">
                  <p className="font-nunito text-[14px] font-bold text-[#3A2418]">
                    Export Thread Inventory
                  </p>
                  <p className="font-nunito text-[12px] text-[#6B544D]">
                    {threadCount} thread{threadCount !== 1 ? "s" : ""} in your stash
                  </p>
                </div>
                <span className="font-nunito text-[12px] text-[#B36050] font-semibold">CSV ↓</span>
              </button>

              <button
                onClick={handleExportPatterns}
                disabled={exporting || patternCount === 0}
                className="w-full bg-white rounded-2xl border border-[#E4D6C8] px-4 py-4 flex items-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-transform text-left"
                style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}
              >
                <span className="text-2xl">📖</span>
                <div className="flex-1">
                  <p className="font-nunito text-[14px] font-bold text-[#3A2418]">
                    Export Pattern Collection
                  </p>
                  <p className="font-nunito text-[12px] text-[#6B544D]">
                    {patternCount} pattern{patternCount !== 1 ? "s" : ""} in your collection
                  </p>
                </div>
                <span className="font-nunito text-[12px] text-[#B36050] font-semibold">CSV ↓</span>
              </button>
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  );
}

// ── Import App Card ──────────────────────────────────────────

function ImportAppCard({
  icon,
  name,
  description,
  onImportThreads,
  onImportPatterns,
}: {
  icon: string;
  name: string;
  description: string;
  onImportThreads: () => void;
  onImportPatterns: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E4D6C8] px-4 py-4"
      style={{ boxShadow: "0 2px 10px rgba(58,36,24,0.05)" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{icon}</span>
        <div className="flex-1">
          <h3 className="font-nunito text-[14px] font-bold text-[#3A2418]">{name}</h3>
          <p className="font-nunito text-[12px] text-[#6B544D] mt-0.5">{description}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onImportThreads}
              className="flex-1 h-10 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-bold text-[#B36050] active:scale-[0.98] transition-transform"
            >
              🧵 Import Threads
            </button>
            <button
              onClick={onImportPatterns}
              className="flex-1 h-10 rounded-xl bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-bold text-[#B36050] active:scale-[0.98] transition-transform"
            >
              📖 Import Patterns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
