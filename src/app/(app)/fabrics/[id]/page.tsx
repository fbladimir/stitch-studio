"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getFabricInventoryItem,
  updateFabricInventoryItem,
  deleteFabricInventoryItem,
  uploadFabricPhoto,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { FabricForm } from "@/components/fabrics/FabricForm";
import type { FabricInventoryItem } from "@/types";

function fabricTypeLabel(type: FabricInventoryItem["fabric_type"]): string {
  const map: Record<string, string> = {
    aida: "Aida",
    linen: "Linen",
    evenweave: "Evenweave",
    other: "Other",
  };
  return type ? (map[type] ?? type) : "";
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function FabricDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [fabric, setFabric] = useState<FabricInventoryItem | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getFabricInventoryItem(id).then(({ data }) => setFabric(data));
  }, [id]);

  const handleEdit = async (
    values: Omit<FabricInventoryItem, "id" | "user_id" | "created_at">,
    photoFile: File | null
  ) => {
    setSubmitting(true);
    try {
      let photoUrl = fabric?.photo_url ?? null;

      if (photoFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { url } = await uploadFabricPhoto(user.id, id, photoFile);
          if (url) photoUrl = url;
        }
      }

      const { data } = await updateFabricInventoryItem(id, { ...values, photo_url: photoUrl });
      if (data) { setFabric(data); setEditing(false); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteFabricInventoryItem(id);
    router.push("/fabrics");
  };

  const loading = fabric === undefined;

  if (loading) {
    return (
      <>
        <TopBar title="Fabric" showBack backHref="/fabrics" />
        <PageWrapper>
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-32 mb-3" />
          <Skeleton className="h-12" />
        </PageWrapper>
      </>
    );
  }

  if (!fabric) {
    return (
      <>
        <TopBar title="Fabric" showBack backHref="/fabrics" />
        <PageWrapper>
          <div className="text-center py-16">
            <p className="font-nunito text-[#896E66]">Fabric not found.</p>
          </div>
        </PageWrapper>
      </>
    );
  }

  const typeLabel = fabricTypeLabel(fabric.fabric_type);

  return (
    <>
      <TopBar
        title={fabric.color_name ?? fabric.manufacturer ?? "Fabric"}
        showBack
        backHref="/fabrics"
        rightElement={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="font-nunito font-semibold text-[14px] text-[#B36050]"
            >
              ✏️ Edit
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="font-nunito font-semibold text-[14px] text-[#896E66]"
            >
              Cancel
            </button>
          )
        }
      />
      <PageWrapper className="pb-10">
        {editing ? (
          <FabricForm
            mode="edit"
            initial={fabric}
            onSubmit={handleEdit}
            submitting={submitting}
          />
        ) : (
          <>
            {/* Photo */}
            {fabric.photo_url && (
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E4D6C8] mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fabric.photo_url}
                  alt={fabric.color_name ?? "Fabric"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Details card */}
            <div
              className="bg-white border border-[#E4D6C8] rounded-2xl p-5 mb-4"
              style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
            >
              <p className="font-playfair font-bold text-[20px] text-[#3A2418] leading-tight">
                {fabric.color_name ?? "Unnamed fabric"}
              </p>
              {fabric.manufacturer && (
                <p className="font-nunito text-[13px] text-[#896E66] mt-1">
                  {fabric.manufacturer}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2.5">
                {typeLabel && (
                  <Row label="Type" value={typeLabel} />
                )}
                {fabric.count && (
                  <Row label="Count" value={`${fabric.count} count`} />
                )}
                {fabric.size && (
                  <Row label="Size" value={fabric.size} />
                )}
              </div>

              {fabric.notes && (
                <p className="font-nunito text-[13px] text-[#896E66] mt-4 pt-4 border-t border-[#F0E6DC]">
                  {fabric.notes}
                </p>
              )}
            </div>

            {/* Badges row */}
            <div className="flex gap-2 flex-wrap mb-4">
              {typeLabel && (
                <span className="px-3 py-1 rounded-full font-nunito text-[12px] font-bold bg-[#FDF4F1] text-[#B36050] border border-[#F0C8BB]">
                  {typeLabel}
                </span>
              )}
              {fabric.count && (
                <span className="px-3 py-1 rounded-full font-nunito text-[12px] font-bold bg-[#F5EEE8] text-[#896E66] border border-[#E4D6C8]">
                  {fabric.count} ct
                </span>
              )}
            </div>

            {/* Delete */}
            <div className="mt-6">
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full h-12 rounded-full border border-[#E4D6C8] font-nunito font-semibold text-[14px] text-[#896E66] bg-white active:scale-[0.98] transition-transform"
                >
                  Remove from stash
                </button>
              ) : (
                <div className="bg-[#FDF0EE] border border-[#F0C8BB] rounded-2xl p-4 flex flex-col gap-3">
                  <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
                    Remove this fabric?
                  </p>
                  <p className="font-nunito text-[13px] text-[#896E66]">
                    This will remove it from your stash permanently.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 h-11 rounded-full border border-[#E4D6C8] font-nunito font-semibold text-[14px] text-[#896E66] bg-white"
                    >
                      Keep it
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 h-11 rounded-full bg-[#B03020] text-white font-nunito font-bold text-[14px] disabled:opacity-60"
                    >
                      {deleting ? "Removing…" : "Yes, remove"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </PageWrapper>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-nunito text-[12px] text-[#B6A090] flex-shrink-0">{label}</span>
      <span className="font-nunito font-semibold text-[13px] text-[#3A2418] text-right">{value}</span>
    </div>
  );
}
