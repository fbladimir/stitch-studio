"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  getPattern,
  getPatternMarkup,
  createPatternMarkup,
  updatePatternMarkup,
  updatePattern,
  uploadChartPhoto,
} from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { createBitfield, countMarked } from "@/lib/markup-cells";
import { GridCanvas, type MarkupTool, type GridCanvasHandle } from "@/components/markup/GridCanvas";
import { MarkupToolbar } from "@/components/markup/MarkupToolbar";
import { MarkupStats } from "@/components/markup/MarkupStats";
import type { Pattern, PatternMarkup } from "@/types";

type SetupStep = "upload" | "grid-size" | "ready";

export default function MarkupPage() {
  const params = useParams();
  const patternId = params.id as string;

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [markup, setMarkup] = useState<PatternMarkup | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup state (for new markups)
  const [setupStep, setSetupStep] = useState<SetupStep | null>(null);
  const [gridRows, setGridRows] = useState(100);
  const [gridCols, setGridCols] = useState(100);
  const [uploadingChart, setUploadingChart] = useState(false);
  const [chartPreview, setChartPreview] = useState<string | null>(null);
  const [chartFile, setChartFile] = useState<File | null>(null);

  // Markup state
  const canvasRef = useRef<GridCanvasHandle>(null);
  const [tool, setTool] = useState<MarkupTool>("mark");
  const [markedCells, setMarkedCells] = useState("");
  const [saving, setSaving] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);

  // Debounced save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [patternRes, markupRes] = await Promise.all([
      getPattern(patternId),
      getPatternMarkup(patternId),
    ]);

    if (patternRes.data) setPattern(patternRes.data);

    if (markupRes.data) {
      setMarkup(markupRes.data);
      setMarkedCells(markupRes.data.marked_cells || "");
      setGridRows(markupRes.data.grid_rows);
      setGridCols(markupRes.data.grid_cols);
    } else {
      // No markup exists — start setup
      setSetupStep("upload");

      // Try to parse grid size from pattern's size_stitches
      if (patternRes.data?.size_stitches) {
        const match = patternRes.data.size_stitches.match(/^(\d+)\s*[xX×]\s*(\d+)/);
        if (match) {
          setGridCols(parseInt(match[1], 10));
          setGridRows(parseInt(match[2], 10));
        }
      }
    }

    setLoading(false);
  }, [patternId]);

  useEffect(() => { load(); }, [load]);

  // Debounced save to Supabase
  const debouncedSave = useCallback(
    (newCells: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (!markup) return;
        setSaving(true);
        const marked = countMarked(newCells);
        await Promise.all([
          updatePatternMarkup(markup.id, { marked_cells: newCells }),
          updatePattern(patternId, { wip_stitches: marked }),
        ]);
        setSaving(false);
      }, 1500);
    },
    [markup, patternId]
  );

  const handleCellToggle = useCallback(
    (_row: number, _col: number, newBitfield: string) => {
      setUndoStack((prev) => [...prev.slice(-50), markedCells]); // Keep last 50
      setMarkedCells(newBitfield);
      debouncedSave(newBitfield);
    },
    [markedCells, debouncedSave]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setMarkedCells(prev);
    debouncedSave(prev);
  }, [undoStack, debouncedSave]);

  // Handle chart photo upload
  const handleChartUpload = async (file: File) => {
    const compressed = await compressImage(file);
    setChartFile(compressed);
    setChartPreview(URL.createObjectURL(compressed));
  };

  // Create markup and start
  const handleStartMarkup = async () => {
    if (!userId || !pattern) return;
    setUploadingChart(true);

    let chartUrl: string | null = null;
    if (chartFile) {
      const { url } = await uploadChartPhoto(userId, patternId, chartFile);
      chartUrl = url;
    }

    const bf = createBitfield(gridRows, gridCols);
    const { data } = await createPatternMarkup({
      pattern_id: patternId,
      user_id: userId,
      chart_photo_url: chartUrl,
      grid_cols: gridCols,
      grid_rows: gridRows,
      calibration: null,
      marked_cells: bf,
    });

    if (data) {
      setMarkup(data);
      setMarkedCells(bf);
      setSetupStep(null);
      toast.success("Markup ready! Start marking your stitches.");
    } else {
      toast.error("Failed to create markup");
    }
    setUploadingChart(false);
  };

  // Zoom controls
  const handleZoomIn = () => canvasRef.current?.zoomIn();
  const handleZoomOut = () => canvasRef.current?.zoomOut();
  const handleFitToScreen = () => canvasRef.current?.fitToScreen();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF6F0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F0C8BB] border-t-[#B36050] rounded-full animate-spin" />
      </div>
    );
  }

  if (!pattern) return null;

  // ── Setup flow ──────────────────────────────────────────────
  if (setupStep) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF6F0] flex flex-col">
        {/* Header */}
        <div className="bg-[#3A2418] px-4 pt-2 pb-3 flex items-center gap-3" style={{ paddingTop: "max(8px, env(safe-area-inset-top, 8px))" }}>
          <Link
            href={`/patterns/${patternId}`}
            className="h-9 px-3 rounded-xl bg-white/10 text-white font-nunito text-[12px] font-bold flex items-center active:scale-95"
          >
            ← Back
          </Link>
          <p className="flex-1 font-nunito text-[14px] font-bold text-white truncate text-center">
            Set Up Pattern Markup
          </p>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[420px] mx-auto px-5 py-6 flex flex-col gap-6">
            {setupStep === "upload" && (
              <>
                <div className="text-center">
                  <span className="text-4xl block mb-2">📐</span>
                  <h2 className="font-playfair text-2xl font-bold text-[#3A2418]">
                    Upload Your Chart
                  </h2>
                  <p className="font-nunito text-[14px] text-[#6B544D] mt-2">
                    Take a photo of your pattern chart — we&apos;ll overlay a grid so you can mark stitches as you go!
                  </p>
                </div>

                {chartPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#E4D6C8]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={chartPreview} alt="Chart preview" className="w-full" />
                    <button
                      onClick={() => { setChartFile(null); setChartPreview(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#3A2418]/60 text-white flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="w-full h-14 rounded-2xl bg-[#FDF4F1] border-2 border-dashed border-[#F0C8BB] font-nunito text-[14px] font-bold text-[#B36050] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-transform">
                      📷 Take Photo of Chart
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleChartUpload(e.target.files[0])}
                      />
                    </label>
                    <label className="w-full h-14 rounded-2xl bg-white border-2 border-[#E4D6C8] font-nunito text-[14px] font-bold text-[#3A2418] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-transform">
                      🖼️ Choose from Library
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleChartUpload(e.target.files[0])}
                      />
                    </label>
                  </div>
                )}

                <button
                  onClick={() => setSetupStep("grid-size")}
                  className="w-full h-12 rounded-full font-nunito font-bold text-[15px] active:scale-[0.97] transition-transform text-white"
                  style={{
                    background: "linear-gradient(135deg, #CA8070, #B36050)",
                    boxShadow: "0 6px 20px rgba(179, 96, 80, 0.3)",
                  }}
                >
                  {chartPreview ? "Next: Set Grid Size →" : "Skip Photo, Set Grid Size →"}
                </button>
              </>
            )}

            {setupStep === "grid-size" && (
              <>
                <div className="text-center">
                  <span className="text-4xl block mb-2">📊</span>
                  <h2 className="font-playfair text-2xl font-bold text-[#3A2418]">
                    Grid Size
                  </h2>
                  <p className="font-nunito text-[14px] text-[#6B544D] mt-2">
                    How many stitches wide and tall is your pattern? Check your chart — it&apos;s usually printed on the cover or first page.
                  </p>
                </div>

                {pattern.size_stitches && (
                  <div className="bg-[#EBF2EC] border border-[#C0D4C2]/50 rounded-xl px-4 py-3">
                    <p className="font-nunito text-[12px] text-[#5F7A63]">
                      💡 From your pattern: <span className="font-bold">{pattern.size_stitches}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
                      Width (stitches)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={gridCols}
                      onChange={(e) => setGridCols(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-12 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[16px] font-bold text-[#3A2418] text-center bg-white focus:outline-none focus:border-[#B36050]"
                    />
                  </div>
                  <div className="flex items-end pb-3 text-[#6B544D] font-bold">×</div>
                  <div className="flex-1">
                    <label className="font-nunito font-semibold text-[13px] text-[#3A2418] block mb-1.5">
                      Height (stitches)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={gridRows}
                      onChange={(e) => setGridRows(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-12 px-3 rounded-xl border border-[#E4D6C8] font-nunito text-[16px] font-bold text-[#3A2418] text-center bg-white focus:outline-none focus:border-[#B36050]"
                    />
                  </div>
                </div>

                <div className="bg-[#FBF5E8] rounded-xl border border-[#AE7C2A]/20 px-4 py-3">
                  <p className="font-nunito text-[13px] text-[#3A2418]">
                    Total: <span className="font-bold">{(gridRows * gridCols).toLocaleString()}</span> stitches
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep("upload")}
                    className="flex-1 h-12 rounded-full border-2 border-[#E4D6C8] font-nunito font-bold text-[14px] text-[#6B544D] active:scale-[0.97]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleStartMarkup}
                    disabled={uploadingChart || gridRows < 1 || gridCols < 1}
                    className="flex-1 h-12 rounded-full text-white font-nunito font-bold text-[14px] disabled:opacity-50 active:scale-[0.97] transition-transform"
                    style={{
                      background: "linear-gradient(135deg, #5F7A63, #4A6B4E)",
                      boxShadow: "0 6px 20px rgba(95, 122, 99, 0.3)",
                    }}
                  >
                    {uploadingChart ? "Setting up..." : "Start Marking ✿"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main markup view ────────────────────────────────────────
  const totalCells = gridRows * gridCols;
  const markedCount = countMarked(markedCells);

  return (
    <div className="fixed inset-0 z-50 bg-[#F5EEE8] flex flex-col">
      {/* Header */}
      <div className="bg-[#3A2418] px-4 pt-2 pb-2 flex items-center gap-2" style={{ paddingTop: "max(8px, env(safe-area-inset-top, 8px))" }}>
        <div className="w-8 h-8 rounded-lg bg-[#5A4438] flex-shrink-0 overflow-hidden flex items-center justify-center">
          {pattern.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pattern.cover_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm opacity-40">📖</span>
          )}
        </div>
        <p className="flex-1 font-nunito text-[13px] font-bold text-white truncate">
          {pattern.name}
        </p>
        <Link
          href={`/patterns/${patternId}`}
          className="h-8 px-3 rounded-lg bg-white/10 text-white font-nunito text-[11px] font-bold flex items-center active:scale-95"
        >
          ← Exit
        </Link>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-[60px] left-3 z-10" style={{ top: "calc(max(8px, env(safe-area-inset-top, 8px)) + 44px)" }}>
        <MarkupStats markedCount={markedCount} totalCells={totalCells} />
      </div>

      {/* Canvas */}
      <GridCanvas
        ref={canvasRef}
        chartImageUrl={markup?.chart_photo_url ?? null}
        gridRows={gridRows}
        gridCols={gridCols}
        markedCells={markedCells}
        tool={tool}
        onCellToggle={handleCellToggle}
      />

      {/* Toolbar */}
      <MarkupToolbar
        tool={tool}
        onToolChange={setTool}
        onUndo={handleUndo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        canUndo={undoStack.length > 0}
        saving={saving}
      />
    </div>
  );
}
