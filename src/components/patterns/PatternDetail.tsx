"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pattern } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { deletePattern, updatePattern, uploadFoPhoto } from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { StatusToggles } from "./StatusToggles";
import { WipTracker } from "./WipTracker";
import { WipJournal } from "./WipJournal";
import { ThreadList } from "./ThreadList";

interface PatternDetailProps {
  initialPattern: Pattern;
}

const CHART_TYPE_LABELS: Record<string, string> = {
  paper: "Paper",
  pdf: "PDF",
  magazine: "Magazine",
  digital: "Digital Download",
};

export function PatternDetail({ initialPattern }: PatternDetailProps) {
  const router = useRouter();
  const [pattern, setPattern] = useState(initialPattern);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const foCameraRef = useRef<HTMLInputElement>(null);
  const foLibraryRef = useRef<HTMLInputElement>(null);
  const ffoCameraRef = useRef<HTMLInputElement>(null);
  const ffoLibraryRef = useRef<HTMLInputElement>(null);
  const [foUploading, setFoUploading] = useState(false);
  const [ffoUploading, setFfoUploading] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deletePattern(pattern.id);
    router.push("/patterns");
  }

  async function handleFoUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "fo" | "ffo"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (type === "fo") setFoUploading(true);
    else setFfoUploading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const compressed = await compressImage(file);
    const { url } = await uploadFoPhoto(user.id, pattern.id, compressed, type);
    if (url) {
      const field = type === "fo" ? "fo_photo_url" : "ffo_photo_url";
      const { data } = await updatePattern(pattern.id, { [field]: url });
      if (data) setPattern(data);
    }

    if (type === "fo") setFoUploading(false);
    else setFfoUploading(false);
  }

  const isFinished = Boolean(pattern.completion_date);

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* ── Cover photo ─────────────────────────────────────── */}
      <div className="w-full aspect-[4/3] bg-[#F5EEE8] rounded-2xl overflow-hidden border border-[#E4D6C8] relative">
        {pattern.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pattern.cover_photo_url}
            alt={pattern.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-6xl opacity-20">📖</span>
            <p className="font-nunito text-[12px] text-[#B6A090]">No cover photo yet</p>
          </div>
        )}
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-[24px] font-bold text-[#3A2418] leading-tight">
            {pattern.name}
          </h1>
          {(pattern.designer || pattern.company) && (
            <p className="font-nunito text-[14px] text-[#896E66] mt-1">
              {[pattern.designer, pattern.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <Link
          href={`/patterns/${pattern.id}/edit`}
          className="flex-shrink-0 h-10 px-4 rounded-full border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#896E66] flex items-center gap-1.5 active:scale-95"
        >
          ✏️ Edit
        </Link>
      </div>

      {/* ── Status Toggles ──────────────────────────────────── */}
      <section>
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
          Status
        </h2>
        <StatusToggles pattern={pattern} onUpdate={setPattern} />
      </section>

      {/* ── WIP Tracker ─────────────────────────────────────── */}
      {pattern.wip && !isFinished && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Progress Tracker
          </h2>
          <WipTracker pattern={pattern} onUpdate={setPattern} />
        </section>
      )}

      {/* ── Finished stats ──────────────────────────────────── */}
      {isFinished && (
        <section className="bg-[#EBF2EC] border border-[#C0D4C2] rounded-2xl px-4 py-4">
          <p className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Finished! 🎉
          </p>
          <div className="flex flex-wrap gap-4 font-nunito text-[13px]">
            {pattern.start_date && (
              <div>
                <p className="font-semibold text-[#3A2418]">Started</p>
                <p className="text-[#5F7A63]">{formatDate(pattern.start_date)}</p>
              </div>
            )}
            {pattern.completion_date && (
              <div>
                <p className="font-semibold text-[#3A2418]">Completed</p>
                <p className="text-[#5F7A63]">{formatDate(pattern.completion_date)}</p>
              </div>
            )}
            {pattern.days_to_complete && (
              <div>
                <p className="font-semibold text-[#3A2418]">Time</p>
                <p className="text-[#5F7A63]">{pattern.days_to_complete} days</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-[#3A2418]">Progress</p>
              <p className="text-[#5F7A63]">{pattern.wip_pct}%</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Pattern Details ──────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-4">
          Pattern Details
        </h2>
        <div className="flex flex-col gap-3">
          {pattern.size_inches && (
            <DetailRow label="Size (inches)" value={pattern.size_inches} />
          )}
          {pattern.size_stitches && (
            <DetailRow label="Size (stitches)" value={pattern.size_stitches} />
          )}
          {pattern.rec_thread_brand && (
            <DetailRow label="Thread Brand" value={pattern.rec_thread_brand} />
          )}
          {pattern.rec_fabric && (
            <DetailRow label="Recommended Fabric" value={pattern.rec_fabric} />
          )}
          {pattern.chart_type && (
            <DetailRow
              label="Chart Type"
              value={CHART_TYPE_LABELS[pattern.chart_type] ?? pattern.chart_type}
            />
          )}
          {pattern.chart_type === "magazine" && (
            <>
              {pattern.magazine_name && (
                <DetailRow label="Magazine" value={pattern.magazine_name} />
              )}
              {pattern.magazine_issue && (
                <DetailRow label="Issue" value={pattern.magazine_issue} />
              )}
              {pattern.magazine_month_year && (
                <DetailRow label="Date" value={pattern.magazine_month_year} />
              )}
            </>
          )}
          {!pattern.size_inches &&
            !pattern.size_stitches &&
            !pattern.rec_thread_brand &&
            !pattern.rec_fabric &&
            !pattern.chart_type && (
              <p className="font-nunito text-[13px] text-[#B6A090]">
                No details recorded yet.{" "}
                <Link href={`/patterns/${pattern.id}/edit`} className="text-[#B36050] font-semibold">
                  Add them now →
                </Link>
              </p>
            )}
        </div>
      </section>

      {/* ── Thread List ──────────────────────────────────────── */}
      <section>
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
          Thread List
        </h2>
        <ThreadList patternId={pattern.id} />
      </section>

      {/* ── Notes ────────────────────────────────────────────── */}
      {pattern.notes && (
        <section className="bg-[#FAF6F0] border border-[#E4D6C8] rounded-2xl px-4 py-4">
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-2">
            Notes
          </h2>
          <p className="font-nunito text-[14px] text-[#3A2418] leading-relaxed whitespace-pre-wrap">
            {pattern.notes}
          </p>
        </section>
      )}

      {/* ── WIP Journal ──────────────────────────────────────── */}
      {(pattern.wip || isFinished) && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Progress Journal
          </h2>
          <WipJournal
            patternId={pattern.id}
            currentPct={pattern.wip_pct}
            currentStitches={pattern.wip_stitches}
          />
        </section>
      )}

      {/* ── FO / FFO Photos ──────────────────────────────────── */}
      {isFinished && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Finished Object Photos
          </h2>
          <div className="flex flex-col gap-3">
            {/* FO Photo */}
            <PhotoUploadBlock
              label="FO — Finished Object"
              subLabel="Flat photo of the finished stitching"
              url={pattern.fo_photo_url}
              uploading={foUploading}
              onCamera={() => foCameraRef.current?.click()}
              onLibrary={() => foLibraryRef.current?.click()}
            />
            <input
              ref={foCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFoUpload(e, "fo")}
              className="hidden"
            />
            <input
              ref={foLibraryRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFoUpload(e, "fo")}
              className="hidden"
            />

            {/* FFO Photo */}
            <PhotoUploadBlock
              label="FFO — Fully Finished Object"
              subLabel="Framed, mounted, or displayed version"
              url={pattern.ffo_photo_url}
              uploading={ffoUploading}
              onCamera={() => ffoCameraRef.current?.click()}
              onLibrary={() => ffoLibraryRef.current?.click()}
            />
            <input
              ref={ffoCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFoUpload(e, "ffo")}
              className="hidden"
            />
            <input
              ref={ffoLibraryRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFoUpload(e, "ffo")}
              className="hidden"
            />
          </div>
        </section>
      )}

      {/* ── Danger zone ──────────────────────────────────────── */}
      <section className="pt-2">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full h-11 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98]"
          >
            Delete this pattern
          </button>
        ) : (
          <div className="bg-[#FDF4F1] border border-[#F0C8BB] rounded-2xl p-4">
            <p className="font-nunito font-bold text-[14px] text-[#B03020] mb-1">
              Delete &ldquo;{pattern.name}&rdquo;?
            </p>
            <p className="font-nunito text-[12px] text-[#896E66] mb-4">
              This will permanently remove the pattern and all its threads. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-full bg-[#B03020] text-white font-nunito font-bold text-[13px] disabled:opacity-60 active:scale-[0.98]"
              >
                {deleting ? "Deleting…" : "Yes, delete it"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98]"
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-nunito text-[12px] font-semibold text-[#896E66] w-36 flex-shrink-0">
        {label}
      </span>
      <span className="font-nunito text-[14px] text-[#3A2418] flex-1">{value}</span>
    </div>
  );
}

function PhotoUploadBlock({
  label,
  subLabel,
  url,
  uploading,
  onCamera,
  onLibrary,
}: {
  label: string;
  subLabel: string;
  url: string | null;
  uploading: boolean;
  onCamera: () => void;
  onLibrary: () => void;
}) {
  return (
    <div className="bg-white border border-[#E4D6C8] rounded-2xl overflow-hidden">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="w-full aspect-video object-cover" />
      ) : (
        <div className="aspect-video bg-[#FAF6F0] flex items-center justify-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#B36050] border-t-transparent rounded-full animate-spin" />
              <p className="font-nunito text-[12px] text-[#896E66]">Uploading…</p>
            </div>
          ) : (
            <span className="text-4xl opacity-20">🖼️</span>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        <p className="font-nunito font-bold text-[13px] text-[#3A2418]">{label}</p>
        <p className="font-nunito text-[11px] text-[#896E66] mb-3">{subLabel}</p>
        <div className="flex gap-2">
          <button
            onClick={onCamera}
            disabled={uploading}
            className="flex-1 h-10 rounded-xl border border-[#E4D6C8] font-nunito font-semibold text-[12px] text-[#3A2418] flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            📷 {url ? "Retake" : "Take Photo"}
          </button>
          <button
            onClick={onLibrary}
            disabled={uploading}
            className="flex-1 h-10 rounded-xl border border-[#E4D6C8] font-nunito font-semibold text-[12px] text-[#3A2418] flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            🖼️ {url ? "Replace" : "Choose"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
