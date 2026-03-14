"use client";

import { useEffect, useState } from "react";
import type { PatternThread, StitchType } from "@/types";
import { THREAD_MANUFACTURERS } from "@/types";
import {
  getPatternThreads,
  addPatternThread,
  updatePatternThread,
  deletePatternThread,
} from "@/lib/supabase/queries";

interface ThreadListProps {
  patternId: string;
}

const STITCH_TYPES: { value: StitchType; label: string }[] = [
  { value: "full", label: "Full Stitch" },
  { value: "backstitch", label: "Backstitch" },
  { value: "french_knot", label: "French Knot" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM = {
  manufacturer: "DMC",
  color_number: "",
  color_name: "",
  strands: "2",
  stitch_type: "full" as StitchType,
  skeins_needed: 1,
};

export function ThreadList({ patternId }: ThreadListProps) {
  const [threads, setThreads] = useState<PatternThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getPatternThreads(patternId).then(({ data }) => {
      setThreads(data ?? []);
      setLoading(false);
    });
  }, [patternId]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
  }

  function openEdit(thread: PatternThread) {
    setShowAdd(false);
    setEditingId(thread.id);
    setForm({
      manufacturer: thread.manufacturer ?? "DMC",
      color_number: thread.color_number ?? "",
      color_name: thread.color_name ?? "",
      strands: thread.strands ?? "2",
      stitch_type: (thread.stitch_type as StitchType) ?? "full",
      skeins_needed: thread.skeins_needed ?? 1,
    });
  }

  function cancelForm() {
    setShowAdd(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveThread() {
    setSaving(true);

    if (editingId) {
      const { data } = await updatePatternThread(editingId, {
        manufacturer: form.manufacturer,
        color_number: form.color_number || null,
        color_name: form.color_name || null,
        strands: form.strands || null,
        stitch_type: form.stitch_type,
        skeins_needed: form.skeins_needed,
      });
      if (data) {
        setThreads((prev) =>
          prev.map((t) => (t.id === editingId ? data : t))
        );
      }
    } else {
      const { data } = await addPatternThread({
        pattern_id: patternId,
        manufacturer: form.manufacturer,
        color_number: form.color_number || null,
        color_name: form.color_name || null,
        strands: form.strands || null,
        stitch_type: form.stitch_type,
        skeins_needed: form.skeins_needed,
        sort_order: threads.length,
      });
      if (data) setThreads((prev) => [...prev, data]);
    }

    cancelForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deletePatternThread(id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
    if (editingId === id) cancelForm();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Thread rows */}
      {threads.length > 0 && (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <div key={thread.id}>
              {editingId === thread.id ? (
                <ThreadForm
                  form={form}
                  onChange={setForm}
                  onSave={saveThread}
                  onCancel={cancelForm}
                  saving={saving}
                  mode="edit"
                />
              ) : (
                <div className="bg-[#FAF6F0] border border-[#E4D6C8] rounded-xl px-3 py-2.5 flex items-center gap-3">
                  {/* Color swatch placeholder */}
                  <div className="w-8 h-8 rounded-lg bg-[#E4D6C8] flex-shrink-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold font-nunito text-[#896E66]">
                      {thread.manufacturer?.slice(0, 1)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-nunito font-bold text-[13px] text-[#3A2418] truncate">
                      {thread.manufacturer} {thread.color_number}
                      {thread.color_name ? ` · ${thread.color_name}` : ""}
                    </p>
                    <p className="font-nunito text-[11px] text-[#896E66]">
                      {[
                        thread.strands ? `${thread.strands} strands` : null,
                        thread.stitch_type
                          ? STITCH_TYPES.find((s) => s.value === thread.stitch_type)?.label
                          : null,
                        thread.skeins_needed > 1
                          ? `${thread.skeins_needed} skeins`
                          : "1 skein",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(thread)}
                      className="w-9 h-9 rounded-xl bg-white border border-[#E4D6C8] flex items-center justify-center text-[#896E66] active:scale-95"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(thread.id)}
                      disabled={deletingId === thread.id}
                      className="w-9 h-9 rounded-xl bg-white border border-[#E4D6C8] flex items-center justify-center text-[#B03020] active:scale-95 disabled:opacity-40"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <ThreadForm
          form={form}
          onChange={setForm}
          onSave={saveThread}
          onCancel={cancelForm}
          saving={saving}
          mode="add"
        />
      )}

      {/* Empty state */}
      {threads.length === 0 && !showAdd && (
        <div className="bg-[#FAF6F0] border border-dashed border-[#E4D6C8] rounded-2xl px-4 py-6 text-center">
          <p className="text-2xl mb-2">🧵</p>
          <p className="font-nunito text-[13px] text-[#896E66]">
            No threads added yet
          </p>
        </div>
      )}

      {/* Add button */}
      {!showAdd && !editingId && (
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 h-11 rounded-full border border-dashed border-[#B36050] text-[#B36050] font-nunito font-semibold text-[13px] active:scale-[0.98] transition-transform"
        >
          <span className="text-lg leading-none">+</span> Add thread
        </button>
      )}
    </div>
  );
}

// ── Inline thread form ────────────────────────────────────────

type FormState = typeof EMPTY_FORM;

function ThreadForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  mode,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  mode: "add" | "edit";
}) {
  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="bg-white border-2 border-[#B36050]/30 rounded-2xl p-4 flex flex-col gap-3">
      <p className="font-nunito font-bold text-[13px] text-[#3A2418]">
        {mode === "add" ? "Add thread" : "Edit thread"}
      </p>

      {/* Row 1: Manufacturer + Color Number */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="field-label">Manufacturer</label>
          <select
            value={form.manufacturer}
            onChange={(e) => field("manufacturer", e.target.value)}
            className="field-input"
          >
            {THREAD_MANUFACTURERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="field-label">Color #</label>
          <input
            type="text"
            placeholder="e.g. 304"
            value={form.color_number}
            onChange={(e) => field("color_number", e.target.value)}
            className="field-input"
          />
        </div>
      </div>

      {/* Color Name */}
      <div>
        <label className="field-label">Color Name</label>
        <input
          type="text"
          placeholder="e.g. Christmas Red"
          value={form.color_name}
          onChange={(e) => field("color_name", e.target.value)}
          className="field-input"
        />
      </div>

      {/* Row 2: Strands + Stitch Type + Skeins */}
      <div className="flex gap-2">
        <div className="w-20">
          <label className="field-label">Strands</label>
          <input
            type="text"
            placeholder="2"
            value={form.strands}
            onChange={(e) => field("strands", e.target.value)}
            className="field-input"
          />
        </div>
        <div className="flex-1">
          <label className="field-label">Stitch Type</label>
          <select
            value={form.stitch_type}
            onChange={(e) => field("stitch_type", e.target.value as StitchType)}
            className="field-input"
          >
            {STITCH_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-20">
          <label className="field-label">Skeins</label>
          <input
            type="number"
            min={1}
            value={form.skeins_needed}
            onChange={(e) => field("skeins_needed", Number(e.target.value))}
            className="field-input"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 h-10 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[13px] disabled:opacity-60 active:scale-[0.98]"
        >
          {saving ? "Saving…" : mode === "add" ? "Add" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 h-10 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
