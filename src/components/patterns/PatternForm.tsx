"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Pattern, ChartType, AIScanCoverResult } from "@/types";
import { THREAD_MANUFACTURERS } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  createPattern,
  updatePattern,
  uploadPatternCover,
  getPatternsForDuplicateCheck,
} from "@/lib/supabase/queries";
import { findDuplicates, type DuplicateCandidate } from "@/lib/duplicate-detection";
import { compressImage, fileToBase64 } from "@/lib/image";
import { useEngagement } from "@/hooks/useEngagement";
import { DuplicateWarning } from "./DuplicateWarning";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Pattern name is required"),
  designer: z.string().optional(),
  company: z.string().optional(),
  size_inches: z.string().optional(),
  size_stitches: z.string().optional(),
  rec_thread_brand: z.string().optional(),
  rec_fabric: z.string().optional(),
  chart_type: z.enum(["paper", "pdf", "magazine", "digital", ""]).optional(),
  magazine_name: z.string().optional(),
  magazine_issue: z.string().optional(),
  magazine_month_year: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────

interface PatternFormProps {
  mode: "create" | "edit";
  initialData?: Pattern;
}

// ── Component ─────────────────────────────────────────────────

export function PatternForm({ mode, initialData }: PatternFormProps) {
  const router = useRouter();
  const { recordActivity } = useEngagement();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.cover_photo_url ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiScanDone, setAiScanDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      designer: initialData?.designer ?? "",
      company: initialData?.company ?? "",
      size_inches: initialData?.size_inches ?? "",
      size_stitches: initialData?.size_stitches ?? "",
      rec_thread_brand: initialData?.rec_thread_brand ?? "",
      rec_fabric: initialData?.rec_fabric ?? "",
      chart_type: (initialData?.chart_type as ChartType | "") ?? "",
      magazine_name: initialData?.magazine_name ?? "",
      magazine_issue: initialData?.magazine_issue ?? "",
      magazine_month_year: initialData?.magazine_month_year ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  const chartType = watch("chart_type");

  // ── Photo selection ────────────────────────────────────────

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  // ── AI Cover Scan ─────────────────────────────────────────

  async function handleAIScan() {
    if (!photoFile) return;
    setAiScanning(true);
    setError(null);

    try {
      const base64 = await fileToBase64(photoFile);
      const res = await fetch("/api/ai/scan-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Scan failed");
      }

      const result: AIScanCoverResult = await res.json();

      // Auto-fill form fields from scan results
      if (result.name) setValue("name", result.name);
      if (result.designer) setValue("designer", result.designer);
      if (result.company) setValue("company", result.company);
      if (result.size_inches) setValue("size_inches", result.size_inches);
      if (result.size_stitches) setValue("size_stitches", result.size_stitches);
      if (result.rec_thread_brand) setValue("rec_thread_brand", result.rec_thread_brand);
      if (result.rec_fabric) setValue("rec_fabric", result.rec_fabric);
      if (result.chart_type) setValue("chart_type", result.chart_type);

      setAiScanDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI scan failed. You can still fill in the fields manually.");
    } finally {
      setAiScanning(false);
    }
  }

  // ── Submit ─────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    if (mode === "create") {
      // Check for duplicates first
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await getPatternsForDuplicateCheck(user.id);
      if (existing) {
        const matches = findDuplicates(
          values.name,
          values.designer ?? null,
          existing
        );
        if (matches.length > 0) {
          setPendingValues(values);
          setDuplicates(matches);
          return;
        }
      }
    }
    await savePattern(values);
  }

  async function savePattern(values: FormValues) {
    setSubmitting(true);
    setError(null);
    setDuplicates([]);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        type: "cross_stitch" as const,
        name: values.name,
        designer: values.designer || null,
        company: values.company || null,
        size_inches: values.size_inches || null,
        size_stitches: values.size_stitches || null,
        rec_thread_brand: values.rec_thread_brand || null,
        rec_fabric: values.rec_fabric || null,
        chart_type: (values.chart_type as ChartType) || null,
        magazine_name: values.chart_type === "magazine" ? (values.magazine_name || null) : null,
        magazine_issue: values.chart_type === "magazine" ? (values.magazine_issue || null) : null,
        magazine_month_year: values.chart_type === "magazine" ? (values.magazine_month_year || null) : null,
        notes: values.notes || null,
        cover_photo_url: initialData?.cover_photo_url ?? null,
        kitted: initialData?.kitted ?? false,
        kitted_date: initialData?.kitted_date ?? null,
        wip: initialData?.wip ?? false,
        wip_pct: initialData?.wip_pct ?? 0,
        wip_stitches: initialData?.wip_stitches ?? 0,
        start_date: initialData?.start_date ?? null,
        last_progress_date: initialData?.last_progress_date ?? null,
        completion_date: initialData?.completion_date ?? null,
        days_to_complete: initialData?.days_to_complete ?? null,
        fo_photo_url: initialData?.fo_photo_url ?? null,
        ffo_photo_url: initialData?.ffo_photo_url ?? null,
        kit_contents: initialData?.kit_contents ?? null,
        kit_status: initialData?.kit_status ?? null,
        stitch_types: initialData?.stitch_types ?? null,
      };

      if (mode === "create") {
        const { data: created, error: createErr } = await createPattern(user.id, payload);
        if (createErr || !created) throw createErr ?? new Error("Failed to create pattern");

        // Upload photo if selected
        if (photoFile) {
          const { url } = await uploadPatternCover(user.id, created.id, photoFile);
          if (url) await updatePattern(created.id, { cover_photo_url: url });
        }

        // Record engagement
        recordActivity("add_pattern", { patternCount: 1 });

        router.push(`/patterns/${created.id}`);
      } else if (mode === "edit" && initialData) {
        // Upload new photo if selected
        let coverUrl = initialData.cover_photo_url;
        if (photoFile) {
          const { url } = await uploadPatternCover(user.id, initialData.id, photoFile);
          if (url) coverUrl = url;
        }

        const { error: updateErr } = await updatePattern(initialData.id, {
          ...payload,
          cover_photo_url: coverUrl,
        });
        if (updateErr) throw updateErr;

        router.push(`/patterns/${initialData.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {/* Duplicate warning modal */}
      {duplicates.length > 0 && pendingValues && (
        <DuplicateWarning
          candidates={duplicates}
          onAddAnyway={() => savePattern(pendingValues)}
          onCancel={() => {
            setDuplicates([]);
            setPendingValues(null);
          }}
          loading={submitting}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pb-8">
        {/* ── Cover Photo ───────────────────────────────────── */}
        <section>
          <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-3">
            Cover Photo
          </p>

          {photoPreview ? (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E4D6C8] mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full text-lg flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#E4D6C8] bg-[#FAF6F0] flex flex-col items-center justify-center mb-3 gap-2">
              <span className="text-4xl opacity-30">📷</span>
              <p className="font-nunito text-[12px] text-[#B6A090]">No photo yet</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex-1 h-11 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#3A2418] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              📷 Take Photo
            </button>
            <button
              type="button"
              onClick={() => libraryRef.current?.click()}
              className="flex-1 h-11 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#3A2418] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              🖼️ Choose from Library
            </button>
          </div>
          {/* AI Scan Button — shown when photo is selected and in create mode */}
          {photoFile && mode === "create" && (
            <div className="mt-3">
              {aiScanDone ? (
                <div className="flex items-center gap-2 bg-[#EBF2EC] border border-[#5F7A63]/20 rounded-xl px-4 py-3">
                  <span className="text-lg">✅</span>
                  <p className="font-nunito text-[13px] text-[#5F7A63] font-semibold">
                    AI filled in the details — review below and save!
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAIScan}
                  disabled={aiScanning}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#B36050] to-[#CA8070] text-white font-nunito font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md disabled:opacity-70"
                >
                  {aiScanning ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Reading cover page...
                    </>
                  ) : (
                    <>
                      <span>✨</span> Auto-fill with AI
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <input
            ref={libraryRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </section>

        {/* ── Basic Info ────────────────────────────────────── */}
        <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
          <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
            Pattern Details
          </p>

          <div>
            <label className="field-label">Pattern Name *</label>
            <input
              {...register("name")}
              placeholder="e.g. Christmas Garden"
              className="field-input"
            />
            {errors.name && (
              <p className="font-nunito text-[11px] text-[#B03020] mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="field-label">Designer</label>
              <input
                {...register("designer")}
                placeholder="e.g. Dimensions"
                className="field-input"
              />
            </div>
            <div className="flex-1">
              <label className="field-label">Company / Publisher</label>
              <input
                {...register("company")}
                placeholder="optional"
                className="field-input"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="field-label">Size (inches)</label>
              <input
                {...register("size_inches")}
                placeholder="e.g. 14 × 14"
                className="field-input"
              />
            </div>
            <div className="flex-1">
              <label className="field-label">Size (stitches)</label>
              <input
                {...register("size_stitches")}
                placeholder="e.g. 196 × 196"
                className="field-input"
              />
            </div>
          </div>
        </section>

        {/* ── Thread & Fabric ───────────────────────────────── */}
        <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
          <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
            Materials
          </p>

          <div>
            <label className="field-label">Recommended Thread Brand</label>
            <select {...register("rec_thread_brand")} className="field-input">
              <option value="">— not specified —</option>
              {THREAD_MANUFACTURERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Recommended Fabric &amp; Count</label>
            <input
              {...register("rec_fabric")}
              placeholder="e.g. 14 Count AIDA White"
              className="field-input"
            />
          </div>
        </section>

        {/* ── Chart Type ────────────────────────────────────── */}
        <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
          <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
            Chart Format
          </p>

          <div>
            <label className="field-label">Chart Type</label>
            <select {...register("chart_type")} className="field-input">
              <option value="">— not specified —</option>
              <option value="paper">Paper</option>
              <option value="pdf">PDF</option>
              <option value="magazine">Magazine</option>
              <option value="digital">Digital Download</option>
            </select>
          </div>

          {/* Magazine conditional fields */}
          {chartType === "magazine" && (
            <>
              <div>
                <label className="field-label">Magazine Name</label>
                <input
                  {...register("magazine_name")}
                  placeholder="e.g. Just Cross Stitch"
                  className="field-input"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="field-label">Issue Number</label>
                  <input
                    {...register("magazine_issue")}
                    placeholder="e.g. Vol. 42 No. 3"
                    className="field-input"
                  />
                </div>
                <div className="flex-1">
                  <label className="field-label">Month / Year</label>
                  <input
                    {...register("magazine_month_year")}
                    placeholder="e.g. Fall 2022"
                    className="field-input"
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Notes ─────────────────────────────────────────── */}
        <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
          <label className="font-playfair font-bold text-[16px] text-[#3A2418] block mb-4">
            Notes
          </label>
          <textarea
            {...register("notes")}
            placeholder="Any notes about this pattern — where you bought it, tips for stitching it, color substitutions you made…"
            rows={4}
            className="field-input textarea"
            style={{ height: "auto", paddingTop: 10, paddingBottom: 10 }}
          />
        </section>

        {/* Error */}
        {error && (
          <p className="font-nunito text-[13px] text-[#B03020] text-center px-4">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[16px] disabled:opacity-60 active:scale-[0.98] transition-transform shadow-md"
        >
          {submitting
            ? mode === "create"
              ? "Adding pattern…"
              : "Saving changes…"
            : mode === "create"
            ? "Add to my collection ✿"
            : "Save changes"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full h-11 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[14px] active:scale-[0.98]"
        >
          Cancel
        </button>
      </form>
    </>
  );
}
