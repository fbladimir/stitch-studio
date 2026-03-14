"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pattern } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { deleteKit, updateKit, uploadFoPhoto } from "@/lib/supabase/queries";
import { compressImage } from "@/lib/image";
import { toast } from "sonner";
import { KitStatusControl } from "./KitStatusControl";
import { WipTracker } from "@/components/patterns/WipTracker";
import { WipJournal } from "@/components/patterns/WipJournal";

interface KitDetailProps {
  initialKit: Pattern;
}

function kitTypeLabel(type: string) {
  return type === "kit_embroidery" ? "Embroidery Kit" : "Cross Stitch Kit";
}

export function KitDetail({ initialKit }: KitDetailProps) {
  const router = useRouter();
  const [kit, setKit] = useState(initialKit);
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
    await deleteKit(kit.id);
    toast.success("Kit deleted");
    router.push("/kits");
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
    const { url } = await uploadFoPhoto(user.id, kit.id, compressed, type);
    if (url) {
      const field = type === "fo" ? "fo_photo_url" : "ffo_photo_url";
      const { data } = await updateKit(kit.id, { [field]: url });
      if (data) {
        setKit(data);
        toast.success("Photo uploaded!");
      }
    }

    if (type === "fo") setFoUploading(false);
    else setFfoUploading(false);
  }

  const isFinished =
    kit.kit_status === "finished" || Boolean(kit.completion_date);
  const isStarted = kit.kit_status === "started";
  const contents = kit.kit_contents;

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* ── Kit Photo ───────────────────────────────────────── */}
      <div className="w-full aspect-[4/3] bg-[#F5EEE8] rounded-2xl overflow-hidden border border-[#E4D6C8]">
        {kit.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kit.cover_photo_url}
            alt={kit.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-7xl opacity-15">🧺</span>
            <p className="font-nunito text-[12px] text-[#B6A090]">
              No photo yet
            </p>
          </div>
        )}
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-playfair text-[24px] font-bold text-[#3A2418] leading-tight">
            {kit.name}
          </h1>
          <p className="font-nunito text-[14px] text-[#896E66] mt-1">
            {[kit.company, kitTypeLabel(kit.type)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link
          href={`/kits/${kit.id}/edit`}
          className="flex-shrink-0 h-10 px-4 rounded-full border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#896E66] flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          ✏️ Edit
        </Link>
      </div>

      {/* ── Status ──────────────────────────────────────────── */}
      <section>
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
          Status
        </h2>
        <KitStatusControl kit={kit} onUpdate={setKit} />
      </section>

      {/* ── Progress Tracker (Started only) ─────────────────── */}
      {isStarted && !isFinished && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Progress Tracker
          </h2>
          <WipTracker pattern={kit} onUpdate={setKit} />
        </section>
      )}

      {/* ── Finished stats ──────────────────────────────────── */}
      {isFinished && (
        <section className="bg-[#EBF2EC] border border-[#C0D4C2] rounded-2xl px-4 py-4">
          <p className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Finished! 🎉
          </p>
          <div className="flex flex-wrap gap-4 font-nunito text-[13px]">
            {kit.start_date && (
              <div>
                <p className="font-semibold text-[#3A2418]">Started</p>
                <p className="text-[#5F7A63]">{formatDate(kit.start_date)}</p>
              </div>
            )}
            {kit.completion_date && (
              <div>
                <p className="font-semibold text-[#3A2418]">Completed</p>
                <p className="text-[#5F7A63]">{formatDate(kit.completion_date)}</p>
              </div>
            )}
            {kit.days_to_complete && (
              <div>
                <p className="font-semibold text-[#3A2418]">Time</p>
                <p className="text-[#5F7A63]">{kit.days_to_complete} days</p>
              </div>
            )}
            {kit.wip_pct > 0 && (
              <div>
                <p className="font-semibold text-[#3A2418]">Progress</p>
                <p className="text-[#5F7A63]">{kit.wip_pct}%</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Kit Details ─────────────────────────────────────── */}
      <section className="bg-white border border-[#E4D6C8] rounded-2xl p-4">
        <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-4">
          Kit Details
        </h2>
        <div className="flex flex-col gap-3">
          {kit.company && (
            <DetailRow label="Brand" value={kit.company} />
          )}
          <DetailRow label="Type" value={kitTypeLabel(kit.type)} />

          {/* What's included */}
          {contents && (
            <div className="pt-1">
              <p className="font-nunito text-[12px] font-semibold text-[#896E66] mb-2">
                Included in box
              </p>
              <div className="flex flex-wrap gap-2">
                {contents.fabric && <ContentPill emoji="🪢" label="Fabric" />}
                {contents.threads && <ContentPill emoji="🧵" label="Threads" />}
                {contents.needle && <ContentPill emoji="🪡" label="Needle" />}
                {contents.pattern && <ContentPill emoji="📄" label="Pattern" />}
                {contents.other && (
                  <ContentPill emoji="➕" label={contents.other} />
                )}
                {!contents.fabric &&
                  !contents.threads &&
                  !contents.needle &&
                  !contents.pattern &&
                  !contents.other && (
                    <p className="font-nunito text-[13px] text-[#B6A090]">
                      Nothing recorded yet.{" "}
                      <Link
                        href={`/kits/${kit.id}/edit`}
                        className="text-[#B36050] font-semibold"
                      >
                        Edit kit →
                      </Link>
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Notes ────────────────────────────────────────────── */}
      {kit.notes && (
        <section className="bg-[#FAF6F0] border border-[#E4D6C8] rounded-2xl px-4 py-4">
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-2">
            Notes
          </h2>
          <p className="font-nunito text-[14px] text-[#3A2418] leading-relaxed whitespace-pre-wrap">
            {kit.notes}
          </p>
        </section>
      )}

      {/* ── Progress Journal (Started or Finished) ───────────── */}
      {(isStarted || isFinished) && (
        <section>
          <h2 className="font-playfair text-[17px] font-bold text-[#3A2418] mb-3">
            Progress Journal
          </h2>
          <WipJournal
            patternId={kit.id}
            currentPct={kit.wip_pct}
            currentStitches={kit.wip_stitches}
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
              url={kit.fo_photo_url}
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
              subLabel="Framed, mounted, or displayed version"
              url={kit.ffo_photo_url}
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
            className="w-full h-12 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98] transition-transform"
          >
            Delete this kit
          </button>
        ) : (
          <div className="bg-[#FDF4F1] border border-[#F0C8BB] rounded-2xl p-4">
            <p className="font-nunito font-bold text-[14px] text-[#B03020] mb-1">
              Delete &ldquo;{kit.name}&rdquo;?
            </p>
            <p className="font-nunito text-[12px] text-[#896E66] mb-4">
              This will permanently remove the kit and all its progress. This
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

// ── Helper components ─────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-nunito text-[12px] font-semibold text-[#896E66] w-28 flex-shrink-0">
        {label}
      </span>
      <span className="font-nunito text-[14px] text-[#3A2418] flex-1">
        {value}
      </span>
    </div>
  );
}

function ContentPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDF4F1] border border-[#F0C8BB] font-nunito text-[12px] font-semibold text-[#B36050]">
      {emoji} {label}
    </span>
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
