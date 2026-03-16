"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createThreadInventoryItem, getThreadInventory, getPatterns, createPattern } from "@/lib/supabase/queries";
import {
  parseThreadCSV,
  parsePatternCSV,
  APP_NAMES,
  APP_ICONS,
  type ImportApp,
  type ImportedThread,
  type ImportedPattern,
} from "@/lib/csv-import";
import { useEngagement } from "@/hooks/useEngagement";
import { ThreadPreviewTable, PatternPreviewTable } from "./ImportPreviewTable";

// ── App-specific export instructions ─────────────────────────

function ExportInstructions({ app, importType }: { app: ImportApp; importType: "threads" | "patterns" }) {
  if (app === "patternkeeper") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📱</span>
          <h3 className="font-playfair text-lg font-bold text-[#3A2418]">Export from PatternKeeper</h3>
        </div>
        <ol className="font-nunito text-[13px] text-[#3A2418] space-y-2.5 list-decimal pl-5">
          <li>Open <span className="font-semibold">PatternKeeper</span> on your device</li>
          {importType === "threads" ? (
            <>
              <li>Go to your <span className="font-semibold">Thread Inventory</span> or open a pattern&apos;s thread list</li>
              <li>Look for the <span className="font-semibold">Export</span> or <span className="font-semibold">Share</span> button (usually a share icon or three dots menu)</li>
              <li>Choose <span className="font-semibold">Export as CSV</span></li>
              <li>Save the file or share it to your device</li>
            </>
          ) : (
            <>
              <li>Go to your <span className="font-semibold">Pattern List</span></li>
              <li>Tap the <span className="font-semibold">menu</span> or <span className="font-semibold">share</span> icon</li>
              <li>Choose <span className="font-semibold">Export as CSV</span></li>
              <li>Save the file to your device</li>
            </>
          )}
        </ol>
        <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-xl px-4 py-3 mt-1">
          <p className="font-nunito text-[12px] text-[#AE7C2A]">
            💡 The CSV should have columns like: {importType === "threads"
              ? "Manufacturer, Color #, Color Name, Quantity"
              : "Name, Designer, Company"}
          </p>
        </div>
      </div>
    );
  }

  if (app === "rxp") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🖥️</span>
          <h3 className="font-playfair text-lg font-bold text-[#3A2418]">Export from R-XP</h3>
        </div>
        <ol className="font-nunito text-[13px] text-[#3A2418] space-y-2.5 list-decimal pl-5">
          <li>Open <span className="font-semibold">R-XP</span> on your computer</li>
          {importType === "threads" ? (
            <>
              <li>Open your pattern or thread inventory</li>
              <li>Go to <span className="font-semibold">File → Export</span> or look for an export option in the thread list</li>
              <li>Choose <span className="font-semibold">CSV format</span></li>
              <li>Save the file, then transfer it to your phone (email, AirDrop, cloud drive)</li>
            </>
          ) : (
            <>
              <li>Go to your pattern library</li>
              <li>Look for <span className="font-semibold">File → Export</span></li>
              <li>Choose <span className="font-semibold">CSV format</span></li>
              <li>Save and transfer to your phone</li>
            </>
          )}
        </ol>
        <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-xl px-4 py-3 mt-1">
          <p className="font-nunito text-[12px] text-[#AE7C2A]">
            💡 R-XP is a Windows app — you&apos;ll need to transfer the exported CSV to your phone via email, AirDrop, or a cloud drive like iCloud or Google Drive.
          </p>
        </div>
      </div>
    );
  }

  // Saga
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🌐</span>
        <h3 className="font-playfair text-lg font-bold text-[#3A2418]">Export from Saga</h3>
      </div>
      <ol className="font-nunito text-[13px] text-[#3A2418] space-y-2.5 list-decimal pl-5">
        <li>Open <span className="font-semibold">Saga</span> in your browser</li>
        {importType === "threads" ? (
          <>
            <li>Navigate to your thread stash or pattern thread list</li>
            <li>Look for an <span className="font-semibold">Export</span> option in the settings or menu</li>
            <li>Download as <span className="font-semibold">CSV</span></li>
          </>
        ) : (
          <>
            <li>Go to your pattern collection</li>
            <li>Find the <span className="font-semibold">Export</span> or <span className="font-semibold">Download</span> option</li>
            <li>Download as <span className="font-semibold">CSV</span></li>
          </>
        )}
      </ol>
      <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-xl px-4 py-3 mt-1">
        <p className="font-nunito text-[12px] text-[#AE7C2A]">
          💡 Saga is a newer app — export options may vary. If CSV isn&apos;t available, try exporting as a spreadsheet and saving as CSV.
        </p>
      </div>
    </div>
  );
}

// ── Main Import Wizard ───────────────────────────────────────

interface ImportWizardProps {
  app: ImportApp;
  importType: "threads" | "patterns";
  onClose: () => void;
}

export function ImportWizard({ app, importType, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [threadItems, setThreadItems] = useState<ImportedThread[]>([]);
  const [patternItems, setPatternItems] = useState<ImportedPattern[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const { recordActivity } = useEngagement();

  // ── File upload handler ──────────────────────────────────
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);

      const text = await selectedFile.text();
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to import data");
        return;
      }

      if (importType === "threads") {
        const { data: existingThreads } = await getThreadInventory(user.id);
        const result = parseThreadCSV(
          text,
          app,
          (existingThreads ?? []).map((t) => ({
            manufacturer: t.manufacturer,
            color_number: t.color_number,
          }))
        );
        setThreadItems(result.items);
        setParseErrors(result.errors);
      } else {
        const { data: existingPatterns } = await getPatterns(user.id);
        const result = parsePatternCSV(
          text,
          app,
          (existingPatterns ?? []).map((p) => ({
            name: p.name,
            designer: p.designer,
          }))
        );
        setPatternItems(result.items);
        setParseErrors(result.errors);
      }

      setStep(2);
    },
    [app, importType]
  );

  // ── Import threads ───────────────────────────────────────
  const handleImportThreads = async () => {
    const selected = threadItems.filter((t) => t.selected);
    if (selected.length === 0) {
      toast.error("No threads selected for import");
      return;
    }

    setImporting(true);
    setStep(3);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let count = 0;
      for (const t of selected) {
        const { error } = await createThreadInventoryItem(user.id, {
          manufacturer: t.manufacturer,
          color_number: t.color_number || null,
          color_name: t.color_name || null,
          quantity: t.quantity,
          thread_type: "cotton",
          notes: `Imported from ${APP_NAMES[app]}`,
        });
        if (!error) count++;
      }

      for (let i = 0; i < Math.min(count, 5); i++) {
        await recordActivity("add_thread_inventory");
      }

      setImportedCount(count);
      toast.success(`${count} thread${count !== 1 ? "s" : ""} added to your stash!`);
    } catch {
      toast.error("Import failed. Some threads may not have been added.");
    } finally {
      setImporting(false);
    }
  };

  // ── Import patterns ──────────────────────────────────────
  const handleImportPatterns = async () => {
    const selected = patternItems.filter((p) => p.selected);
    if (selected.length === 0) {
      toast.error("No patterns selected for import");
      return;
    }

    setImporting(true);
    setStep(3);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let count = 0;
      for (const p of selected) {
        const { error } = await createPattern(user.id, {
          type: "cross_stitch",
          name: p.name,
          designer: p.designer || null,
          company: p.company || null,
          size_inches: p.size_inches || null,
          size_stitches: p.size_stitches || null,
          rec_thread_brand: p.rec_thread_brand || null,
          rec_fabric: p.rec_fabric || null,
          chart_type: (p.chart_type as "paper" | "pdf" | "magazine" | "digital") || null,
          magazine_name: null,
          magazine_issue: null,
          magazine_month_year: null,
          cover_photo_url: null,
          notes: p.notes || `Imported from ${APP_NAMES[app]}`,
          kitted: false,
          kitted_date: null,
          wip: false,
          wip_pct: 0,
          wip_stitches: 0,
          start_date: null,
          last_progress_date: null,
          completion_date: null,
          days_to_complete: null,
          fo_photo_url: null,
          ffo_photo_url: null,
          kit_contents: null,
          kit_status: null,
          stitch_types: null,
          daily_stitch_target: 0,
        });
        if (!error) count++;
      }

      for (let i = 0; i < Math.min(count, 5); i++) {
        await recordActivity("add_pattern");
      }

      setImportedCount(count);
      toast.success(`${count} pattern${count !== 1 ? "s" : ""} imported!`);
    } catch {
      toast.error("Import failed. Some patterns may not have been added.");
    } finally {
      setImporting(false);
    }
  };

  // ── Toggle handlers ──────────────────────────────────────
  const toggleThread = (index: number) => {
    setThreadItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAllThreads = (selected: boolean) => {
    setThreadItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const togglePattern = (index: number) => {
    setPatternItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAllPatterns = (selected: boolean) => {
    setPatternItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const items = importType === "threads" ? threadItems : patternItems;
  const selectedCount =
    importType === "threads"
      ? threadItems.filter((t) => t.selected).length
      : patternItems.filter((p) => p.selected).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{APP_ICONS[app]}</span>
          <h2 className="font-playfair text-xl font-bold text-[#3A2418]">
            Import {importType === "threads" ? "Threads" : "Patterns"}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="font-nunito text-[13px] text-[#6B544D] hover:text-[#3A2418]"
        >
          Cancel
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              s === step
                ? "bg-[#B36050]"
                : s < step
                ? "bg-[#F0C8BB]"
                : "bg-[#E4D6C8]"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Instructions ──────────────────────────── */}
      {step === 1 && (
        <>
          <ExportInstructions app={app} importType={importType} />

          {/* File upload */}
          <div className="mt-2">
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-[#E4D6C8] rounded-2xl px-6 py-8 flex flex-col items-center gap-3 hover:border-[#B36050] hover:bg-[#FDF4F1] transition-colors">
                <span className="text-3xl">📄</span>
                <p className="font-nunito text-[14px] font-semibold text-[#3A2418]">
                  Choose your CSV file
                </p>
                <p className="font-nunito text-[12px] text-[#6B544D]">
                  Tap to select a .csv file from your device
                </p>
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </label>
          </div>
        </>
      )}

      {/* ── Step 2: Preview ───────────────────────────────── */}
      {step === 2 && (
        <>
          {/* File info */}
          {file && (
            <div className="flex items-center gap-2 bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-xl px-4 py-3">
              <span className="text-lg">📎</span>
              <p className="font-nunito text-[13px] text-[#3A2418] font-semibold truncate flex-1">
                {file.name}
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  setThreadItems([]);
                  setPatternItems([]);
                  setParseErrors([]);
                  setStep(1);
                }}
                className="font-nunito text-[12px] text-[#B36050] font-semibold"
              >
                Change file
              </button>
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-xl px-4 py-3">
              <p className="font-nunito text-[12px] font-semibold text-[#B03020] mb-1">
                Some issues were found:
              </p>
              {parseErrors.map((err, i) => (
                <p key={i} className="font-nunito text-[11px] text-[#B03020]">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {items.length > 0 ? (
            <>
              {importType === "threads" ? (
                <ThreadPreviewTable
                  items={threadItems}
                  onToggle={toggleThread}
                  onToggleAll={toggleAllThreads}
                />
              ) : (
                <PatternPreviewTable
                  items={patternItems}
                  onToggle={togglePattern}
                  onToggleAll={toggleAllPatterns}
                />
              )}

              {/* Import button */}
              <button
                onClick={
                  importType === "threads" ? handleImportThreads : handleImportPatterns
                }
                disabled={selectedCount === 0}
                className="w-full h-12 rounded-full bg-[#5F7A63] text-white font-nunito font-bold text-[14px] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 shadow-md"
              >
                Import {selectedCount} {importType === "threads" ? "thread" : "pattern"}
                {selectedCount !== 1 ? "s" : ""} {importType === "threads" ? "🧵" : "📖"}
              </button>
            </>
          ) : (
            <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-2xl px-4 py-8 text-center">
              <span className="text-3xl block mb-2">😕</span>
              <p className="font-nunito text-[14px] text-[#B03020] font-semibold">
                No {importType === "threads" ? "threads" : "patterns"} found
              </p>
              <p className="font-nunito text-[12px] text-[#6B544D] mt-1">
                Make sure your CSV file has the right columns and is exported from {APP_NAMES[app]}.
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  setStep(1);
                }}
                className="mt-3 font-nunito text-[13px] text-[#B36050] font-semibold underline"
              >
                Try a different file
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Step 3: Result ────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col items-center text-center gap-4 py-6">
          {importing ? (
            <>
              <div className="w-12 h-12 border-4 border-[#F0C8BB] border-t-[#B36050] rounded-full animate-spin" />
              <p className="font-nunito text-[14px] text-[#3A2418] font-semibold">
                Importing your {importType === "threads" ? "threads" : "patterns"}...
              </p>
              <p className="font-nunito text-[12px] text-[#6B544D]">
                This may take a moment
              </p>
            </>
          ) : (
            <>
              <span className="text-5xl">✅</span>
              <h3 className="font-playfair text-xl font-bold text-[#3A2418]">
                Import Complete!
              </h3>
              <p className="font-nunito text-[14px] text-[#5F7A63] font-semibold">
                {importedCount} {importType === "threads" ? "thread" : "pattern"}
                {importedCount !== 1 ? "s" : ""} added to your{" "}
                {importType === "threads" ? "stash" : "collection"} from {APP_NAMES[app]}!
              </p>
              <button
                onClick={onClose}
                className="mt-2 w-full h-12 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[14px] active:scale-[0.98] shadow-md"
              >
                Done ✿
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
