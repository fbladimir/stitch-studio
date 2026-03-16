"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Pattern, KitStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createKit, updateKit, uploadKitPhoto } from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { useEngagement } from "@/hooks/useEngagement";
import { toast } from "sonner";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Kit name is required"),
  company: z.string().optional(),
  type: z.enum(["kit_cross_stitch", "kit_embroidery"]),
  contents_fabric: z.boolean(),
  contents_threads: z.boolean(),
  contents_needle: z.boolean(),
  contents_pattern: z.boolean(),
  contents_other: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────

interface KitFormProps {
  mode: "create" | "edit";
  initialData?: Pattern;
}

// ── Kit type pill selector ────────────────────────────────────

const KIT_TYPE_OPTIONS: { value: "kit_cross_stitch" | "kit_embroidery"; label: string; emoji: string }[] = [
  { value: "kit_cross_stitch", label: "Cross Stitch", emoji: "✖️" },
  { value: "kit_embroidery", label: "Embroidery", emoji: "🌸" },
];

// ── Contents pill data ────────────────────────────────────────

const CONTENTS_ITEMS = [
  { field: "contents_fabric" as const, emoji: "🪢", label: "Fabric" },
  { field: "contents_threads" as const, emoji: "🧵", label: "Threads" },
  { field: "contents_needle" as const, emoji: "🪡", label: "Needle" },
  { field: "contents_pattern" as const, emoji: "📄", label: "Pattern" },
];

// ── Component ─────────────────────────────────────────────────

export function KitForm({ mode, initialData }: KitFormProps) {
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

  // Parse existing kit_contents
  const existingContents = initialData?.kit_contents;

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
      company: initialData?.company ?? "",
      type:
        (initialData?.type as "kit_cross_stitch" | "kit_embroidery") ??
        "kit_cross_stitch",
      contents_fabric: existingContents?.fabric ?? false,
      contents_threads: existingContents?.threads ?? false,
      contents_needle: existingContents?.needle ?? false,
      contents_pattern: existingContents?.pattern ?? false,
      contents_other: existingContents?.other ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  const selectedType = watch("type");

  // ── Photo ───────────────────────────────────────────────────

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
    e.target.value = "";
  }

  // ── Contents toggle ─────────────────────────────────────────

  function toggleContent(field: keyof Pick<FormValues, "contents_fabric" | "contents_threads" | "contents_needle" | "contents_pattern">) {
    setValue(field, !watch(field));
  }

  // ── Submit ──────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const kit_contents = {
        fabric: values.contents_fabric,
        threads: values.contents_threads,
        needle: values.contents_needle,
        pattern: values.contents_pattern,
        other: values.contents_other ?? "",
      };

      const payload: Omit<Pattern, "id" | "user_id" | "created_at" | "updated_at"> = {
        type: values.type,
        name: values.name,
        company: values.company || null,
        kit_contents,
        kit_status: (initialData?.kit_status ?? "unopened") as KitStatus,
        notes: values.notes || null,
        // preserve existing status fields
        cover_photo_url: initialData?.cover_photo_url ?? null,
        designer: null,
        size_inches: null,
        size_stitches: null,
        rec_thread_brand: null,
        rec_fabric: null,
        chart_type: null,
        magazine_name: null,
        magazine_issue: null,
        magazine_month_year: null,
        kitted: false,
        kitted_date: null,
        wip: false,
        wip_pct: initialData?.wip_pct ?? 0,
        wip_stitches: initialData?.wip_stitches ?? 0,
        start_date: initialData?.start_date ?? null,
        last_progress_date: initialData?.last_progress_date ?? null,
        completion_date: initialData?.completion_date ?? null,
        days_to_complete: initialData?.days_to_complete ?? null,
        fo_photo_url: initialData?.fo_photo_url ?? null,
        ffo_photo_url: initialData?.ffo_photo_url ?? null,
        stitch_types: null,
        daily_stitch_target: 0,
      };

      if (mode === "create") {
        const { data: created, error: createErr } = await createKit(
          user.id,
          payload
        );
        if (createErr || !created)
          throw createErr ?? new Error("Failed to create kit");

        if (photoFile) {
          const { url } = await uploadKitPhoto(user.id, created.id, photoFile);
          if (url) await updateKit(created.id, { cover_photo_url: url });
        }

        recordActivity("add_pattern", { patternCount: 1 });
        toast.success("Kit added to your collection!");
        router.push(`/kits/${created.id}`);
      } else if (mode === "edit" && initialData) {
        let photoUrl = initialData.cover_photo_url;
        if (photoFile) {
          const { url } = await uploadKitPhoto(
            user.id,
            initialData.id,
            photoFile
          );
          if (url) photoUrl = url;
        }

        const { error: updateErr } = await updateKit(initialData.id, {
          ...payload,
          cover_photo_url: photoUrl,
        });
        if (updateErr) throw updateErr;

        toast.success("Changes saved!");
        router.push(`/kits/${initialData.id}`);
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

      {/* ── Kit Photo ─────────────────────────────────────────── */}
      <section>
        <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-3">
          Kit Photo
        </p>

        {photoPreview ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E4D6C8] mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Kit preview"
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
            <span className="text-5xl opacity-20">🧺</span>
            <p className="font-nunito text-[12px] text-[#9A8578]">
              Photo of the kit packaging
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

      {/* ── Kit Details ───────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
        <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
          Kit Details
        </p>

        <div>
          <label className="field-label">Kit Name *</label>
          <input
            {...register("name")}
            placeholder="e.g. Dimensions Christmas Stocking"
            className="field-input"
          />
          {errors.name && (
            <p className="font-nunito text-[11px] text-[#B03020] mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="field-label">Brand / Manufacturer</label>
          <input
            {...register("company")}
            placeholder="e.g. Dimensions, Bucilla, Vervaco"
            className="field-input"
          />
        </div>

        {/* Kit type — iOS-style pill selector */}
        <div>
          <label className="field-label">Kit Type</label>
          <div
            className="flex rounded-2xl p-1 gap-1 mt-1"
            style={{ backgroundColor: "#EDE5DC" }}
          >
            {KIT_TYPE_OPTIONS.map((opt) => {
              const isActive = selectedType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("type", opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-nunito font-semibold text-[13px] transition-all duration-200 active:scale-[0.97] ${
                    isActive
                      ? "bg-white text-[#3A2418] shadow-sm"
                      : "text-[#9A8578]"
                  }`}
                  style={{
                    boxShadow: isActive ? "0 1px 4px rgba(58,36,24,0.10)" : undefined,
                  }}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What's Included ───────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
        <div>
          <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
            What&apos;s Included
          </p>
          <p className="font-nunito text-[12px] text-[#9A8578] mt-0.5">
            Tap everything that came in the box
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CONTENTS_ITEMS.map(({ field, emoji, label }) => {
            const checked = watch(field);
            return (
              <button
                key={field}
                type="button"
                onClick={() => toggleContent(field)}
                className={`flex items-center gap-2 h-11 px-4 rounded-full border font-nunito font-semibold text-[13px] transition-all duration-150 active:scale-[0.96] ${
                  checked
                    ? "bg-[#FDF4F1] border-[#B36050] text-[#B36050]"
                    : "bg-white border-[#E4D6C8] text-[#6B544D]"
                }`}
              >
                <span>{emoji}</span>
                {label}
                {checked && <span className="text-[#B36050]">✓</span>}
              </button>
            );
          })}
        </div>

        <div>
          <label className="field-label">Other contents</label>
          <input
            {...register("contents_other")}
            placeholder="e.g. hoop, frame, beads…"
            className="field-input"
          />
        </div>
      </section>

      {/* ── Notes ─────────────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <label className="font-playfair font-bold text-[16px] text-[#3A2418] block mb-4">
          Notes
        </label>
        <textarea
          {...register("notes")}
          placeholder="Where you got it, why you love it, any tips…"
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
            ? "Adding kit…"
            : "Saving changes…"
          : mode === "create"
          ? "Add to my collection 🧺"
          : "Save changes"}
      </button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full h-12 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[14px] active:scale-[0.98]"
      >
        Cancel
      </button>
    </form>
  );
}
