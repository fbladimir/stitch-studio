"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { THREAD_MANUFACTURERS } from "@/types";
import type { ThreadInventoryItem, ThreadType } from "@/types";

const THREAD_TYPES: { id: ThreadType; label: string }[] = [
  { id: "cotton", label: "Cotton" },
  { id: "silk", label: "Silk" },
  { id: "rayon", label: "Rayon" },
  { id: "wool", label: "Wool" },
  { id: "perle", label: "Perle" },
  { id: "blended", label: "Blended" },
  { id: "other", label: "Other" },
];

const schema = z.object({
  manufacturer: z.string().min(1, "Manufacturer is required"),
  color_number: z.string().optional(),
  color_name: z.string().optional(),
  thread_type: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ThreadFormProps {
  mode: "add" | "edit";
  initial?: Partial<ThreadInventoryItem>;
  onSubmit: (
    values: Omit<ThreadInventoryItem, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  submitting: boolean;
}

export function ThreadForm({ mode, initial, onSubmit, submitting }: ThreadFormProps) {
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [threadType, setThreadType] = useState<ThreadType | null>(
    initial?.thread_type ?? null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      manufacturer: initial?.manufacturer ?? "",
      color_number: initial?.color_number ?? "",
      color_name: initial?.color_name ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      manufacturer: values.manufacturer,
      color_number: values.color_number ?? null,
      color_name: values.color_name ?? null,
      quantity,
      thread_type: threadType,
      notes: values.notes ?? null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">

      {/* Manufacturer */}
      <div>
        <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
          Manufacturer <span className="text-[#B36050]">*</span>
        </label>
        <select
          {...register("manufacturer")}
          className="w-full h-11 px-3.5 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] appearance-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23896E66' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
        >
          <option value="">Select manufacturer…</option>
          {THREAD_MANUFACTURERS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {errors.manufacturer && (
          <p className="font-nunito text-[12px] text-[#B03020] mt-1">{errors.manufacturer.message}</p>
        )}
      </div>

      {/* Color Number + Color Name — side by side */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
            Color Number
          </label>
          <input
            {...register("color_number")}
            type="text"
            placeholder="e.g. 3865"
            className="w-full h-11 px-3.5 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6]"
          />
        </div>
        <div className="flex-1">
          <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
            Color Name
          </label>
          <input
            {...register("color_name")}
            type="text"
            placeholder="e.g. White Bright"
            className="w-full h-11 px-3.5 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6]"
          />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-2">
          Quantity in Skeins
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(0, q - 1))}
            className="w-12 h-12 rounded-full border-2 border-[#E4D6C8] bg-white text-[#B36050] font-bold text-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            −
          </button>
          <span className="font-nunito font-bold text-[28px] text-[#3A2418] w-12 text-center tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-12 h-12 rounded-full border-2 border-[#B36050] bg-[#B36050] text-white font-bold text-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            +
          </button>
        </div>
      </div>

      {/* Thread Type */}
      <div>
        <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-2">
          Thread Type
        </label>
        <div className="flex flex-wrap gap-2">
          {THREAD_TYPES.map((t) => {
            const active = threadType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThreadType(active ? null : t.id)}
                className={`h-9 px-4 rounded-full font-nunito font-semibold text-[13px] border transition-colors ${
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

      {/* Notes */}
      <div>
        <label className="block font-nunito font-bold text-[13px] text-[#3A2418] mb-1.5">
          Notes
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Any notes about this thread…"
          className="w-full px-3.5 py-3 rounded-2xl border border-[#E4D6C8] bg-white font-nunito text-[14px] text-[#3A2418] focus:outline-none focus:border-[#B36050] placeholder:text-[#C4AFA6] resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full h-13 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 mt-1"
        style={{ height: 52 }}
      >
        {submitting ? (
          "Saving…"
        ) : mode === "add" ? (
          <>🧵 Add to my stash</>
        ) : (
          <>Save changes</>
        )}
      </button>
    </form>
  );
}
