"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FABRIC_MANUFACTURERS } from "@/types";
import type { FabricInventoryItem, FabricType, FabricCount } from "@/types";
import { fileToBase64 } from "@/lib/image";

const FABRIC_COUNTS: FabricCount[] = ["14", "16", "18", "20", "22", "25", "28", "32", "36"];

const FABRIC_TYPES: { id: FabricType; label: string }[] = [
  { id: "aida", label: "Aida" },
  { id: "linen", label: "Linen" },
  { id: "evenweave", label: "Evenweave" },
  { id: "other", label: "Other" },
];

const schema = z.object({
  manufacturer: z.string().optional(),
  color_name: z.string().optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FabricFormProps {
  mode: "add" | "edit";
  initial?: Partial<FabricInventoryItem>;
  onSubmit: (
    values: Omit<FabricInventoryItem, "id" | "user_id" | "created_at">,
    photoFile: File | null
  ) => Promise<void>;
  submitting: boolean;
}

export function FabricForm({ mode, initial, onSubmit, submitting }: FabricFormProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initial?.photo_url ?? null
  );
  const [fabricType, setFabricType] = useState<FabricType | null>(
    initial?.fabric_type ?? null
  );
  const [fabricCount, setFabricCount] = useState<FabricCount | null>(
    initial?.count ?? null
  );

  const [aiScanning, setAiScanning] = useState(false);
  const [aiScanDone, setAiScanDone] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      manufacturer: initial?.manufacturer ?? "",
      color_name: initial?.color_name ?? "",
      size: initial?.size ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Lazy-import to avoid SSR issues
    const { compressImage } = await import("@/lib/image");
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
    e.target.value = "";
  }

  async function handleAIScan() {
    if (!photoFile) return;
    setAiScanning(true);
    setAiError(null);

    try {
      const base64 = await fileToBase64(photoFile);
      const res = await fetch("/api/ai/scan-fabric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Scan failed");
      }

      const result = await res.json();

      // Auto-fill form fields
      if (result.manufacturer) {
        // Match to our known manufacturers
        const match = FABRIC_MANUFACTURERS.find(
          (m) => m.toLowerCase() === result.manufacturer.toLowerCase()
        );
        setValue("manufacturer", match || "Other");
      }
      if (result.color_name) setValue("color_name", result.color_name);
      if (result.size) setValue("size", result.size);
      if (result.fabric_type) {
        const validTypes: FabricType[] = ["aida", "linen", "evenweave", "other"];
        if (validTypes.includes(result.fabric_type)) {
          setFabricType(result.fabric_type);
        }
      }
      if (result.count) {
        const validCounts: FabricCount[] = ["14", "16", "18", "20", "22", "25", "28", "32", "36"];
        if (validCounts.includes(result.count)) {
          setFabricCount(result.count);
        }
      }

      setAiScanDone(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI scan failed. You can still fill in the fields manually.");
    } finally {
      setAiScanning(false);
    }
  }

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit(
      {
        manufacturer: values.manufacturer || null,
        color_name: values.color_name || null,
        size: values.size || null,
        count: fabricCount,
        fabric_type: fabricType,
        photo_url: initial?.photo_url ?? null,
        notes: values.notes || null,
      },
      photoFile
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5 pb-8">

      {/* Fabric Photo */}
      <section>
        <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-3">
          Fabric Photo
        </p>

        {photoPreview ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E4D6C8] mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Fabric preview"
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
            <span className="text-5xl opacity-20">🪢</span>
            <p className="font-nunito text-[12px] text-[#B6A090]">Photo of your fabric</p>
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
        {/* AI Scan Button — shown when photo is selected and in add mode */}
        {photoFile && mode === "add" && (
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
                    Identifying fabric...
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

        {/* AI Error */}
        {aiError && (
          <div className="mt-2 bg-[#FDF0EE] border border-[#B03020]/20 rounded-xl px-4 py-3">
            <p className="font-nunito text-[13px] text-[#B03020]">{aiError}</p>
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
        <input ref={libraryRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
      </section>

      {/* Fabric Details */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
        <p className="font-playfair font-bold text-[16px] text-[#3A2418]">Fabric Details</p>

        {/* Manufacturer */}
        <div>
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
            Manufacturer
          </label>
          <select
            {...register("manufacturer")}
            className="w-full h-11 px-3.5 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23896E66' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
          >
            <option value="">Select manufacturer…</option>
            {FABRIC_MANUFACTURERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Color Name */}
        <div>
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
            Color / Colorway
          </label>
          <input
            {...register("color_name")}
            type="text"
            placeholder="e.g. Antique White, Raw Linen, Cream"
            className="w-full h-11 px-3.5 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6]"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
            Size
          </label>
          <input
            {...register("size")}
            type="text"
            placeholder='e.g. 9x10 inches, 12x18 inches'
            className="w-full h-11 px-3.5 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6]"
          />
        </div>
      </section>

      {/* Fabric Type */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4 flex flex-col gap-4">
        <p className="font-playfair font-bold text-[16px] text-[#3A2418]">Type &amp; Count</p>

        <div>
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-2">
            Fabric Type
          </label>
          <div className="flex gap-2 flex-wrap">
            {FABRIC_TYPES.map((t) => {
              const active = fabricType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFabricType(active ? null : t.id)}
                  className={`h-10 px-5 rounded-full font-nunito font-semibold text-[13px] border transition-colors ${
                    active
                      ? "bg-[#B36050] border-[#B36050] text-white"
                      : "bg-white border-[#E4D6C8] text-[#896E66]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-2">
            Fabric Count
          </label>
          <div className="flex gap-2 flex-wrap">
            {FABRIC_COUNTS.map((c) => {
              const active = fabricCount === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFabricCount(active ? null : c)}
                  className={`h-10 px-4 rounded-full font-nunito font-semibold text-[13px] border transition-colors ${
                    active
                      ? "bg-[#B36050] border-[#B36050] text-white"
                      : "bg-white border-[#E4D6C8] text-[#896E66]"
                  }`}
                >
                  {c} ct
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <label className="font-playfair font-bold text-[16px] text-[#3A2418] block mb-4">
          Notes
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Where you got it, what you plan to use it for…"
          className="w-full px-3.5 py-3 rounded-2xl border border-[#E4D6C8] bg-[#FAF6F0] font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6] resize-none"
        />
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full h-14 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[16px] disabled:opacity-60 active:scale-[0.98] transition-transform shadow-md"
      >
        {submitting
          ? mode === "add" ? "Adding fabric…" : "Saving changes…"
          : mode === "add" ? "Add to my stash 🪢" : "Save changes"}
      </button>
    </form>
  );
}
