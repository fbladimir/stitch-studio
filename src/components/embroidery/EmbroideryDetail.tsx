"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pattern } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { deleteEmbroidery, updateEmbroidery, uploadFoPhoto } from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { toast } from "sonner";
import { EmbroideryStatusControl } from "./EmbroideryStatusControl";
import { WipTracker } from "@/components/patterns/WipTracker";
import { WipJournal } from "@/components/patterns/WipJournal";

interface EmbroideryDetailProps {
  initialEmbroidery: Pattern;
}

export function EmbroideryDetail({ initialEmbroidery }: EmbroideryDetailProps) {
  const router = useRouter();
  const [embroidery, setEmbroidery] = useState(initialEmbroidery);
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
    await deleteEmbroidery(embroidery.id);
    toast.success("Embroidery deleted");
    router.push("/embroidery");
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const compressed = await compressImage(file);
    const { url } = await uploadFoPhoto(user.id, embroidery.id, compressed, type);
    if (url) {
      const field = type === "fo" ? "fo_photo_url" : "ffo_photo_url";
      const { data } = await updateEmbroidery(embroidery.id, { [field]: url });
      if (data) {
        setEmbroidery(data);
        toast.success("Photo uploaded!");
      }
    }

    if (type === "fo") setFoUploading(false);
    else setFfoUploading(false);
  }

  const isWip = embroidery.wip && !embroidery.completion_date;
  const isFinished = Boolean(embroidery.completion_date);

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* ── Cover Photo ──────────────────────────────────────── */}
      <div className="w-full aspect-[4/3] bg-[#F5EEE8] rounded-2xl overflow-hidden border border-[#E4D6C8]">
        {embroidery.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={embroidery.cover_photo_url}
            alt={embroidery.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-7xl opacity-15">🌸</span>
            <p className="font-nunito text-[12px] text-[#B6A090]">No photo yet</p>
          </div>
        )}
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-[24px] font-bold text-[#3A2418] leading-tight">
            {embroidery.name}
          </h1>
          {(embroidery.designer || embroidery.company) && (
            <p className="font-nunito text-[14px] text-[#896E66] mt-1">
              {[embroidery.designer, embroidery.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <Link
          href={`/embroidery/${embroidery.id}/edit`}
          className="flex-shrink-0 h-10 px-4 rounded-full border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#896E66] flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          ✏️ Edit
        </Link>
      </div>

      {/* ── Status ───────────────────────────────────────────── */}
      <section>
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
          Status
        </h2>
        <EmbroideryStatusControl embroidery={embroidery} onUpdate={setEmbroidery} />
      </section>

      {/* ── Progress Tracker (WIP only) ───────────────────────── */}
      {isWip && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Progress Tracker
          </h2>
          <WipTracker pattern={embroidery} onUpdate={setEmbroidery} />
        </section>
      )}

      {/* ── Finished stats ────────────────────────────────────── */}
      {isFinished && (
        <section className="bg-[#EBF2EC] border border-[#C0D4C2] rounded-2xl px-4 py-4">
          <p className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Finished! 🎉
          </p>
          <div className="flex flex-wrap gap-4 font-nunito text-[13px]">
            {embroidery.start_date && (
              <div>
                <p className="font-semibold text-[#3A2418]">Started</p>
                <p className="text-[#5F7A63]">{formatDate(embroidery.start_date)}</p>
              </div>
            )}
            {embroidery.completion_date && (
              <div>
                <p className="font-semibold text-[#3A2418]">Completed</p>
                <p className="text-[#5F7A63]">{formatDate(embroidery.completion_date)}</p>
              </div>
            )}
            {embroidery.days_to_complete && (
              <div>
                <p className="font-semibold text-[#3A2418]">Time</p>
                <p className="text-[#5F7A63]">{embroidery.days_to_complete} days</p>
              </div>
            )}
            {embroidery.wip_pct > 0 && (
              <div>
                <p className="font-semibold text-[#3A2418]">Progress</p>
                <p className="text-[#5F7A63]">{embroidery.wip_pct}%</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Pattern Details ───────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-4">
          Pattern Details
        </h2>
        <div className="flex flex-col gap-3">
          {embroidery.designer && (
            <DetailRow label="Designer" value={embroidery.designer} />
          )}
          {embroidery.company && (
            <DetailRow label="Company" value={embroidery.company} />
          )}
          {embroidery.rec_thread_brand && (
            <DetailRow label="Thread Type" value={embroidery.rec_thread_brand} />
          )}
          {embroidery.rec_fabric && (
            <DetailRow label="Fabric" value={embroidery.rec_fabric} />
          )}

          {/* Stitch types */}
          {embroidery.stitch_types && embroidery.stitch_types.length > 0 && (
            <div>
              <p className="font-nunito text-[12px] font-semibold text-[#896E66] mb-2">
                Stitch types
              </p>
              <div className="flex flex-wrap gap-2">
                {embroidery.stitch_types.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-semibold text-[#B36050]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!embroidery.designer &&
            !embroidery.company &&
            !embroidery.rec_thread_brand &&
            !embroidery.rec_fabric &&
            (!embroidery.stitch_types || embroidery.stitch_types.length === 0) && (
              <p className="font-nunito text-[13px] text-[#B6A090]">
                No details recorded yet.{" "}
                <Link
                  href={`/embroidery/${embroidery.id}/edit`}
                  className="text-[#B36050] font-semibold"
                >
                  Edit pattern →
                </Link>
              </p>
            )}
        </div>
      </section>

      {/* ── Notes ─────────────────────────────────────────────── */}
      {embroidery.notes && (
        <section className="bg-[#FAF6F0] border border-[#E4D6C8] rounded-2xl px-4 py-4">
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-2">
            Notes
          </h2>
          <p className="font-nunito text-[14px] text-[#3A2418] leading-relaxed whitespace-pre-wrap">
            {embroidery.notes}
          </p>
        </section>
      )}

      {/* ── Progress Journal (WIP or Finished) ───────────────── */}
      {(isWip || isFinished) && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Progress Journal
          </h2>
          <WipJournal
            patternId={embroidery.id}
            currentPct={embroidery.wip_pct}
            currentStitches={embroidery.wip_stitches}
          />
        </section>
      )}

      {/* ── FO / FFO Photos (Finished only) ──────────────────── */}
      {isFinished && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Finished Object Photos
          </h2>
          <div className="flex flex-col gap-3">
            <PhotoUploadBlock
              label="FO — Finished Object"
              subLabel="Flat photo of the finished piece"
              url={embroidery.fo_photo_url}
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

            <PhotoUploadBlock
              label="FFO — Fully Finished Object"
              subLabel="Framed, hooped, or displayed version"
              url={embroidery.ffo_photo_url}
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

      {/* ── Danger zone ───────────────────────────────────────── */}
      <section className="pt-2">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full h-12 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98] transition-transform"
          >
            Delete this pattern
          </button>
        ) : (
          <div className="bg-[#FDF4F1] border border-[#F0C8BB] rounded-2xl p-4">
            <p className="font-nunito font-bold text-[14px] text-[#B03020] mb-1">
              Delete &ldquo;{embroidery.name}&rdquo;?
            </p>
            <p className="font-nunito text-[12px] text-[#896E66] mb-4">
              This will permanently remove the pattern and all its progress. This
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-12 rounded-full bg-[#B03020] text-white font-nunito font-bold text-[13px] disabled:opacity-60 active:scale-[0.98] transition-transform"
              >
                {deleting ? "Deleting…" : "Yes, delete it"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98] transition-transform"
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

// ── Helper components ──────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-nunito text-[12px] font-semibold text-[#896E66] w-28 flex-shrink-0">
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
        <img src={url} alt={label} className="w-full aspect-video object-cover" loading="lazy" />
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
            className="flex-1 h-11 rounded-xl border border-[#E4D6C8] font-nunito font-semibold text-[12px] text-[#3A2418] flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 transition-transform"
          >
            📷 {url ? "Retake" : "Take Photo"}
          </button>
          <button
            onClick={onLibrary}
            disabled={uploading}
            className="flex-1 h-11 rounded-xl border border-[#E4D6C8] font-nunito font-semibold text-[12px] text-[#3A2418] flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 transition-transform"
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
