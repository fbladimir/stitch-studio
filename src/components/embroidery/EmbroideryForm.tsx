"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Pattern } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  createEmbroidery,
  updateEmbroidery,
  uploadPatternCover,
} from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { useEngagement } from "@/hooks/useEngagement";
import { toast } from "sonner";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Pattern name is required"),
  designer: z.string().optional(),
  company: z.string().optional(),
  thread_type: z.string().optional(),
  fabric_type: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Options ───────────────────────────────────────────────────

const THREAD_TYPES = [
  "Stranded Cotton",
  "Perle Cotton",
  "Wool",
  "Silk",
  "Mixed",
];

const FABRIC_TYPES = [
  "Linen",
  "Cotton",
  "Interfaced",
  "Hoop frame",
  "Other",
];

// ── Props ─────────────────────────────────────────────────────

interface EmbroideryFormProps {
  mode: "create" | "edit";
  initialData?: Pattern;
}

// ── Component ─────────────────────────────────────────────────

export function EmbroideryForm({ mode, initialData }: EmbroideryFormProps) {
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

  // Stitch types — chip-style tag input
  const [stitchTypes, setStitchTypes] = useState<string[]>(
    initialData?.stitch_types ?? []
  );
  const [stitchInput, setStitchInput] = useState("");

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
      thread_type: initialData?.rec_thread_brand ?? "",
      fabric_type: initialData?.rec_fabric ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  const selectedThreadType = watch("thread_type");
  const selectedFabricType = watch("fabric_type");

  // ── Photo ───────────────────────────────────────────────────

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
    e.target.value = "";
  }

  // ── Stitch type chips ────────────────────────────────────────

  function addStitchType() {
    const val = stitchInput.trim();
    if (val && !stitchTypes.includes(val)) {
      setStitchTypes((prev) => [...prev, val]);
    }
    setStitchInput("");
  }

  function handleStitchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addStitchType();
    } else if (e.key === "Backspace" && !stitchInput && stitchTypes.length > 0) {
      setStitchTypes((prev) => prev.slice(0, -1));
    }
  }

  function removeStitchType(val: string) {
    setStitchTypes((prev) => prev.filter((s) => s !== val));
  }

  // ── Submit ──────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);

    // Flush any pending stitch input
    const finalStitchTypes = [...stitchTypes];
    if (stitchInput.trim() && !finalStitchTypes.includes(stitchInput.trim())) {
      finalStitchTypes.push(stitchInput.trim());
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload: Omit<Pattern, "id" | "user_id" | "created_at" | "updated_at"> = {
        type: "embroidery",
        name: values.name,
        designer: values.designer || null,
        company: values.company || null,
        rec_thread_brand: values.thread_type || null,
        rec_fabric: values.fabric_type || null,
        stitch_types: finalStitchTypes.length > 0 ? finalStitchTypes : null,
        notes: values.notes || null,
        // preserve status fields on edit
        cover_photo_url: initialData?.cover_photo_url ?? null,
        size_inches: null,
        size_stitches: null,
        chart_type: null,
        magazine_name: null,
        magazine_issue: null,
        magazine_month_year: null,
        kitted: false,
        kitted_date: null,
        wip: initialData?.wip ?? false,
        wip_pct: initialData?.wip_pct ?? 0,
        wip_stitches: initialData?.wip_stitches ?? 0,
        start_date: initialData?.start_date ?? null,
        last_progress_date: initialData?.last_progress_date ?? null,
        completion_date: initialData?.completion_date ?? null,
        days_to_complete: initialData?.days_to_complete ?? null,
        fo_photo_url: initialData?.fo_photo_url ?? null,
        ffo_photo_url: initialData?.ffo_photo_url ?? null,
        kit_contents: null,
        kit_status: null,
      };

      if (mode === "create") {
        const { data: created, error: createErr } = await createEmbroidery(
          user.id,
          payload
        );
        if (createErr || !created)
          throw createErr ?? new Error("Failed to create embroidery");

        if (photoFile) {
          const { url } = await uploadPatternCover(user.id, created.id, photoFile);
          if (url) await updateEmbroidery(created.id, { cover_photo_url: url });
        }

        recordActivity("add_pattern", { patternCount: 1 });
        toast.success("Embroidery added to your collection!");
        router.push(`/embroidery/${created.id}`);
      } else if (mode === "edit" && initialData) {
        let photoUrl = initialData.cover_photo_url;
        if (photoFile) {
          const { url } = await uploadPatternCover(user.id, initialData.id, photoFile);
          if (url) photoUrl = url;
        }

        const { error: updateErr } = await updateEmbroidery(initialData.id, {
          ...payload,
          cover_photo_url: photoUrl,
        });
        if (updateErr) throw updateErr;

        toast.success("Changes saved!");
        router.push(`/embroidery/${initialData.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pb-8">

      {/* ── Cover Photo ───────────────────────────────────────── */}
      <section>
        <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-3">
          Cover Photo
        </p>

        {photoPreview ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E4D6C8] mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Embroidery preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
              className="absolute top-2 right-2 w-9 h-9 bg-black/50 text-white rounded-full text-xl flex items-center justify-center active:scale-90"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#E4D6C8] bg-[#FAF6F0] flex flex-col items-center justify-center mb-3 gap-2">
            <span className="text-5xl opacity-20">🌸</span>
            <p className="font-nunito text-[12px] text-[#B6A090]">
              Photo of the pattern or design
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 h-12 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#3A2418] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            📷 Take Photo
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className="flex-1 h-12 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#3A2418] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            🖼️ Choose from Library
          </button>
        </div>
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

      {/* ── Pattern Details ────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
        <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
          Pattern Details
        </p>

        <div>
          <label className="field-label">Pattern Name *</label>
          <input
            {...register("name")}
            placeholder="e.g. Wildflower Wreath"
            className="field-input"
          />
          {errors.name && (
            <p className="font-nunito text-[11px] text-[#B03020] mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="field-label">Designer</label>
          <input
            {...register("designer")}
            placeholder="e.g. Mary Hickmott"
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Company / Publisher</label>
          <input
            {...register("company")}
            placeholder="e.g. Anchor, Bucilla"
            className="field-input"
          />
        </div>
      </section>

      {/* ── Stitch Types ───────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
            Stitch Types
          </p>
          <p className="font-nunito text-[12px] text-[#B6A090] mt-0.5">
            Type a stitch and press Enter to add it
          </p>
        </div>

        {/* Chip display */}
        {stitchTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stitchTypes.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-semibold text-[#B36050]"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeStitchType(s)}
                  className="text-[#B36050] opacity-70 hover:opacity-100 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={stitchInput}
            onChange={(e) => setStitchInput(e.target.value)}
            onKeyDown={handleStitchKeyDown}
            onBlur={addStitchType}
            placeholder="e.g. satin stitch, chain stitch…"
            className="flex-1 field-input"
          />
          <button
            type="button"
            onClick={addStitchType}
            className="h-12 px-4 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#B36050] active:scale-[0.97] flex-shrink-0"
          >
            Add
          </button>
        </div>
      </section>

      {/* ── Thread & Fabric ────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
        <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
          Thread & Fabric
        </p>

        {/* Thread type — pill selector */}
        <div>
          <label className="field-label">Thread Type</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {THREAD_TYPES.map((t) => {
              const isActive = selectedThreadType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("thread_type", isActive ? "" : t)}
                  className={`h-10 px-4 rounded-full border font-nunito font-semibold text-[13px] transition-all duration-150 active:scale-[0.96] ${
                    isActive
                      ? "bg-[#FDF4F1] border-[#B36050] text-[#B36050]"
                      : "bg-white border-[#E4D6C8] text-[#896E66]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fabric — pill selector */}
        <div>
          <label className="field-label">Fabric</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {FABRIC_TYPES.map((f) => {
              const isActive = selectedFabricType === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setValue("fabric_type", isActive ? "" : f)}
                  className={`h-10 px-4 rounded-full border font-nunito font-semibold text-[13px] transition-all duration-150 active:scale-[0.96] ${
                    isActive
                      ? "bg-[#FDF4F1] border-[#B36050] text-[#B36050]"
                      : "bg-white border-[#E4D6C8] text-[#896E66]"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Notes ─────────────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <label className="font-playfair font-bold text-[16px] text-[#3A2418] block mb-4">
          Notes
        </label>
        <textarea
          {...register("notes")}
          placeholder="Where you got it, what inspired you, tips for stitching it…"
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
          ? "Add to my collection 🌸"
          : "Save changes"}
      </button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full h-12 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[14px] active:scale-[0.98]"
      >
        Cancel
      </button>
    </form>
  );
}
