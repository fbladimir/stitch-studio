"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PatternThread, StitchType, AIScanThreadResult } from "@/types";
import { THREAD_MANUFACTURERS } from "@/types";
import {
  getPatternThreads,
  addPatternThread,
  updatePatternThread,
  deletePatternThread,
} from "@/lib/supabase/queries";
import { compressImage, fileToBase64 } from "@/lib/image";

interface ThreadListProps {
  patternId: string;
}

type ThreadSort = "added" | "number_asc" | "number_desc" | "name_asc";

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
  const [sortBy, setSortBy] = useState<ThreadSort>("added");

  // AI scan state
  const scanCameraRef = useRef<HTMLInputElement>(null);
  const scanLibraryRef = useRef<HTMLInputElement>(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResults, setAiResults] = useState<AIScanThreadResult[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImporting, setAiImporting] = useState(false);

  useEffect(() => {
    getPatternThreads(patternId).then(({ data }) => {
      setThreads(data ?? []);
      setLoading(false);
    });
  }, [patternId]);

  const sortedThreads = useMemo(() => {
    const copy = [...threads];
    switch (sortBy) {
      case "number_asc":
        return copy.sort((a, b) => {
          const na = parseInt(a.color_number ?? "", 10);
          const nb = parseInt(b.color_number ?? "", 10);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return (a.color_number ?? "").localeCompare(b.color_number ?? "");
        });
      case "number_desc":
        return copy.sort((a, b) => {
          const na = parseInt(a.color_number ?? "", 10);
          const nb = parseInt(b.color_number ?? "", 10);
          if (!isNaN(na) && !isNaN(nb)) return nb - na;
          return (b.color_number ?? "").localeCompare(a.color_number ?? "");
        });
      case "name_asc":
        return copy.sort((a, b) =>
          (a.color_name ?? "").localeCompare(b.color_name ?? "")
        );
      default:
        return copy; // insertion order
    }
  }, [threads, sortBy]);

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

  // ── AI Color Key Scan ──────────────────────────────────────

  async function handleScanPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setAiScanning(true);
    setAiError(null);
    setAiResults(null);

    try {
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);

      const res = await fetch("/api/ai/scan-colorkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Scan failed");
      }

      const data = await res.json();
      const raw: AIScanThreadResult[] = data.threads || [];

      // Deduplicate: keep one entry per manufacturer+color_number combo.
      // If the same thread appears for different stitch types (full, backstitch, french knot),
      // keep only the first occurrence to avoid duplicates.
      const seen = new Set<string>();
      const deduped = raw.filter((t) => {
        const key = `${(t.manufacturer || "").toLowerCase()}-${(t.color_number || "").toLowerCase()}`;
        if (!key || key === "-") return true; // keep threads without identifiers
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setAiResults(deduped);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to scan. Please try again.");
    } finally {
      setAiScanning(false);
    }
  }

  async function importAiThreads() {
    if (!aiResults || aiResults.length === 0) return;
    setAiImporting(true);

    try {
      for (let i = 0; i < aiResults.length; i++) {
        const t = aiResults[i];
        const { data } = await addPatternThread({
          pattern_id: patternId,
          manufacturer: t.manufacturer || "DMC",
          color_number: t.color_number || null,
          color_name: t.color_name || null,
          strands: t.strands || "2",
          stitch_type: (t.stitch_type as StitchType) || "full",
          skeins_needed: t.skeins_needed || 1,
          sort_order: threads.length + i,
        });
        if (data) setThreads((prev) => [...prev, data]);
      }
      setAiResults(null);
    } catch {
      setAiError("Some threads could not be imported. You can add them manually.");
    } finally {
      setAiImporting(false);
    }
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
      {/* Sort dropdown */}
      {threads.length > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-nunito text-[12px] text-[#6B544D]">
            {threads.length} thread{threads.length !== 1 ? "s" : ""}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ThreadSort)}
            className="h-8 px-2.5 rounded-lg border border-[#E4D6C8] bg-white font-nunito text-[12px] text-[#3A2418] focus:outline-none focus:border-[#B36050] appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B544D' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "24px" }}
          >
            <option value="added">As Added</option>
            <option value="number_asc">Color # ↑</option>
            <option value="number_desc">Color # ↓</option>
            <option value="name_asc">Name A→Z</option>
          </select>
        </div>
      )}

      {/* Thread rows */}
      {sortedThreads.length > 0 && (
        <div className="flex flex-col gap-2">
          {sortedThreads.map((thread) => (
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
                    <span className="text-[10px] font-bold font-nunito text-[#6B544D]">
                      {thread.manufacturer?.slice(0, 1)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-nunito font-bold text-[13px] text-[#3A2418] truncate">
                      {thread.manufacturer} {thread.color_number}
                      {thread.color_name ? ` · ${thread.color_name}` : ""}
                    </p>
                    <p className="font-nunito text-[11px] text-[#6B544D]">
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
                      className="w-9 h-9 rounded-xl bg-white border border-[#E4D6C8] flex items-center justify-center text-[#6B544D] active:scale-95"
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
          <p className="font-nunito text-[13px] text-[#6B544D]">
            No threads added yet
          </p>
        </div>
      )}

      {/* AI Scan Results Preview */}
      {aiResults && aiResults.length > 0 && (
        <div className="bg-[#FBF5E8] border border-[#AE7C2A]/20 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-nunito font-bold text-[13px] text-[#3A2418]">
              ✨ Found {aiResults.length} thread{aiResults.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setAiResults(null)}
              className="text-[11px] font-nunito text-[#6B544D] underline"
            >
              Dismiss
            </button>
          </div>

          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {aiResults.map((t, i) => (
              <div
                key={i}
                className="bg-white/70 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded bg-[#E4D6C8] flex-shrink-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold font-nunito text-[#6B544D]">
                    {t.manufacturer?.slice(0, 1)}
                  </span>
                </div>
                <p className="font-nunito text-[12px] text-[#3A2418] truncate flex-1">
                  {t.manufacturer} {t.color_number}
                  {t.color_name ? ` · ${t.color_name}` : ""}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={importAiThreads}
            disabled={aiImporting}
            className="w-full h-11 rounded-full bg-[#5F7A63] text-white font-nunito font-bold text-[13px] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {aiImporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding threads...
              </>
            ) : (
              <>Add all {aiResults.length} threads</>
            )}
          </button>
        </div>
      )}

      {/* AI Scan Error */}
      {aiError && (
        <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-xl px-4 py-3">
          <p className="font-nunito text-[13px] text-[#B03020]">{aiError}</p>
        </div>
      )}

      {/* Action buttons */}
      {!showAdd && !editingId && (
        <div className="flex flex-col gap-2">
          {/* AI Scan buttons */}
          {aiScanning ? (
            <div className="flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-[#B36050] to-[#CA8070] text-white font-nunito font-bold text-[13px]">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scanning color key...
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scanCameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full bg-gradient-to-r from-[#B36050] to-[#CA8070] text-white font-nunito font-bold text-[12px] active:scale-[0.98] shadow-sm"
              >
                📷 Scan Color Key
              </button>
              <button
                type="button"
                onClick={() => scanLibraryRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-full bg-gradient-to-r from-[#CA8070] to-[#B36050] text-white font-nunito font-bold text-[12px] active:scale-[0.98] shadow-sm"
              >
                🖼️ From Library
              </button>
            </div>
          )}

          {/* Manual add button */}
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 h-11 rounded-full border border-dashed border-[#B36050] text-[#B36050] font-nunito font-semibold text-[13px] active:scale-[0.98] transition-transform"
          >
            <span className="text-lg leading-none">+</span> Add thread manually
          </button>
        </div>
      )}

      {/* Hidden file inputs for AI scan */}
      <input
        ref={scanCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleScanPhoto}
        className="hidden"
      />
      <input
        ref={scanLibraryRef}
        type="file"
        accept="image/*"
        onChange={handleScanPhoto}
        className="hidden"
      />
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
          className="flex-1 h-10 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[13px] active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
