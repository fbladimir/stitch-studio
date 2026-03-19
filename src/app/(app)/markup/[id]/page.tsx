"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import {
  getPattern,
  getPatternMarkup,
  createPatternMarkup,
  updatePatternMarkup,
  uploadChartPhoto,
} from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { createBitfield, countMarked } from "@/lib/markup-cells";
import { GridCanvas, type MarkupTool, type GridCanvasHandle } from "@/components/markup/GridCanvas";
import { MarkupToolbar } from "@/components/markup/MarkupToolbar";
import { MarkupStats } from "@/components/markup/MarkupStats";
import { useEngagement } from "@/hooks/useEngagement";
import type { Pattern, PatternMarkup, Dog, CelebrationData } from "@/types";

type SetupStep = "upload" | "grid-size" | "ready";

// ── Markup milestone messages ──────────────────────────────────

const MARK_MILESTONES: [number, (dog: string) => string][] = [
  [5,   (d) => `${d} says: Nice start! Keep going! 🐾`],
  [10,  (d) => `${d} is wagging their tail — 10 stitches! ✨`],
  [25,  (d) => `25 stitches! ${d} is doing a happy dance 💃🐾`],
  [50,  (d) => `Halfway to 100! ${d} brought you a treat 🦴`],
  [100, (d) => `🎉 100 stitches! ${d} is SO proud of you!`],
  [200, (d) => `200! ${d} can barely contain the excitement 🐾✨`],
  [500, (d) => `FIVE HUNDRED! ${d} is howling with joy! 🎉🐕`],
];

const PCT_MILESTONES = [25, 50, 75];
const PCT_MESSAGES: Record<number, (dog: string) => string> = {
  25: (d) => `Quarter done! ${d} is cheering you on! 🎉`,
  50: (d) => `HALFWAY THERE! ${d} can see the finish line! 🐾🔥`,
  75: (d) => `75%! Almost there — ${d} is losing their mind with excitement! 🎊`,
};

function pickDog(dogs: Dog[]): string {
  if (dogs.length === 0) return "Your fur babies";
  const d = dogs[Math.floor(Math.random() * dogs.length)];
  return `${d.emoji} ${d.name}`;
}

function getMarkMilestone(count: number, dogs: Dog[]): string | null {
  const m = MARK_MILESTONES.find(([n]) => n === count);
  if (m) return m[1](pickDog(dogs));
  if (count > 500 && count % 100 === 0) return `${count} stitches! ${pickDog(dogs)} can't believe it 🐾🔥`;
  return null;
}

// ── In-page notification component ────────────────────────────

function MarkupNotification({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="absolute left-3 right-3 z-20 flex items-center justify-center pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
    >
      <div
        className="px-5 py-3 rounded-2xl bg-[#3A2418]/90 backdrop-blur-sm shadow-lg pointer-events-auto"
        style={{ animation: "fadeSlideUp 0.3s ease-out, fadeOut 0.4s ease-in 3s forwards" }}
      >
        <p className="font-nunito text-[14px] text-white text-center font-semibold leading-snug">
          {message}
        </p>
      </div>
    </div>
  );
}

// ── Session summary overlay ───────────────────────────────────

function SessionSummary({ marks, minutes, patternName, onClose }: {
  marks: number; minutes: number; patternName: string; onClose: () => void;
}) {
  if (marks === 0) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 max-w-[320px] w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeSlideUp 0.3s ease-out" }}
      >
        <span className="text-4xl block mb-2">✿</span>
        <h2 className="font-playfair text-[22px] font-bold text-[#3A2418] mb-1">
          Great session!
        </h2>
        <p className="font-nunito text-[14px] text-[#6B544D] mb-4">
          {patternName}
        </p>
        <div className="flex gap-3 justify-center mb-5">
          <div className="bg-[#FDF4F1] rounded-2xl px-4 py-3 flex-1">
            <p className="font-nunito text-[22px] font-bold text-[#B36050]">{marks}</p>
            <p className="font-nunito text-[11px] text-[#6B544D]">stitches marked</p>
          </div>
          <div className="bg-[#EBF2EC] rounded-2xl px-4 py-3 flex-1">
            <p className="font-nunito text-[22px] font-bold text-[#5F7A63]">{minutes}</p>
            <p className="font-nunito text-[11px] text-[#6B544D]">minutes</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[15px] active:scale-[0.97] transition-transform"
        >
          Done ✿
        </button>
      </div>
    </div>
  );
}

export default function MarkupPage() {
  const params = useParams();
  const patternId = params.id as string;

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [markup, setMarkup] = useState<PatternMarkup | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const pctMilestonesHitRef = useRef(new Set<number>());
  const pushCelebration = useAppStore((s) => s.pushCelebration);

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

  // Session mark counter for milestone celebrations
  const sessionMarksRef = useRef(0);
  const { recordActivity } = useEngagement();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Load dogs from profile for milestone messages
    const { data: profile } = await supabase
      .from("profiles")
      .select("dogs")
      .eq("id", user.id)
      .single();
    if (profile?.dogs) setDogs(profile.dogs as Dog[]);

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

  // Debounced save to Supabase — only saves markup data, does NOT
  // overwrite pattern.wip_stitches (user controls that manually in WipTracker)
  const debouncedSave = useCallback(
    (newCells: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (!markup) return;
        setSaving(true);
        await updatePatternMarkup(markup.id, { marked_cells: newCells });
        setSaving(false);
      }, 1500);
    },
    [markup]
  );

  const handleCellToggle = useCallback(
    (_row: number, _col: number, newBitfield: string) => {
      setUndoStack((prev) => [...prev.slice(-50), markedCells]); // Keep last 50
      setMarkedCells(newBitfield);
      debouncedSave(newBitfield);

      const oldCount = countMarked(markedCells);
      const newCount = countMarked(newBitfield);
      if (newCount <= oldCount) return; // erasing, skip celebrations

      sessionMarksRef.current += (newCount - oldCount);
      const total = gridRows * gridCols;

      // ── 100% completion → full confetti celebration ──────────
      if (total > 0 && newCount >= total) {
        const dogName = pickDog(dogs);
        const celebration: CelebrationData = {
          type: "pattern_finished",
          title: "✿ Pattern Complete! ✿",
          subtitle: "Every single stitch — marked!",
          patternName: pattern?.name,
          coverPhotoUrl: pattern?.cover_photo_url ?? undefined,
          dogLine: `${dogName} is doing zoomies! 🐾🎉`,
          stats: [
            { label: "Stitches", value: total.toLocaleString() },
            { label: "This Session", value: sessionMarksRef.current.toLocaleString() },
          ],
        };
        pushCelebration(celebration);
        recordActivity("mark_finished");
        return;
      }

      // ── Percentage milestones (25%, 50%, 75%) ────────────────
      if (total > 0) {
        const pct = Math.floor((newCount / total) * 100);
        for (const milestone of PCT_MILESTONES) {
          if (pct >= milestone && !pctMilestonesHitRef.current.has(milestone)) {
            pctMilestonesHitRef.current.add(milestone);
            const msg = PCT_MESSAGES[milestone](pickDog(dogs));
            setNotification(msg);
            if (milestone === 50) recordActivity("log_wip_progress");
            return; // one notification at a time
          }
        }
      }

      // ── Mark count milestones ────────────────────────────────
      const msg = getMarkMilestone(sessionMarksRef.current, dogs);
      if (msg) {
        setNotification(msg);
        if (sessionMarksRef.current === 10 || sessionMarksRef.current === 50 || sessionMarksRef.current === 100) {
          recordActivity("log_wip_progress");
        }
      }
    },
    [markedCells, debouncedSave, dogs, recordActivity, gridRows, gridCols, pattern, pushCelebration]
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
        <button
          onClick={() => {
            if (sessionMarksRef.current > 0) {
              setShowSummary(true);
            } else {
              window.location.href = `/patterns/${patternId}`;
            }
          }}
          className="h-8 px-3 rounded-lg bg-white/10 text-white font-nunito text-[11px] font-bold flex items-center active:scale-95"
        >
          ← Exit
        </button>
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

      {/* In-page notification (above toolbar) */}
      {notification && (
        <MarkupNotification
          key={notification}
          message={notification}
          onDone={() => setNotification(null)}
        />
      )}

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

      {/* Session summary on exit */}
      {showSummary && (
        <SessionSummary
          marks={sessionMarksRef.current}
          minutes={Math.round((Date.now() - sessionStartRef.current) / 60000)}
          patternName={pattern.name}
          onClose={() => { window.location.href = `/patterns/${patternId}`; }}
        />
      )}
    </div>
  );
}
