"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getThreadInventoryItem,
  updateThreadInventoryItem,
  deleteThreadInventoryItem,
  getPatternsUsingThread,
} from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { ThreadForm } from "@/components/threads/ThreadForm";
import { toast } from "sonner";
import type { ThreadInventoryItem, Pattern } from "@/types";

function statusBadge(p: Pattern): { text: string; classes: string } {
  if (p.completion_date) return { text: "Finished ✓", classes: "bg-[#EBF2EC] text-[#5F7A63]" };
  if (p.wip) return { text: `WIP${p.wip_pct ? ` · ${p.wip_pct}%` : ""}`, classes: "bg-[#FBF5E8] text-[#AE7C2A]" };
  return { text: "Not started", classes: "bg-[#F5EEE8] text-[#6B544D]" };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [thread, setThread] = useState<ThreadInventoryItem | null | undefined>(undefined);
  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quantityLoading, setQuantityLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await getThreadInventoryItem(id);
      setThread(data);

      if (data?.color_number && data.manufacturer) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: pData } = await getPatternsUsingThread(
            user.id,
            data.manufacturer,
            data.color_number
          );
          // pData is array of { pattern_id, patterns: [...] }
          if (pData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const extracted = (pData as any[])
              .map((row) => {
                const p = Array.isArray(row.patterns) ? row.patterns[0] : row.patterns;
                return p ?? null;
              })
              .filter(Boolean) as Pattern[];
            setPatterns(extracted);
          } else {
            setPatterns([]);
          }
        }
      } else {
        setPatterns([]);
      }
    };
    load();
  }, [id]);

  const updateQuantity = async (newQty: number) => {
    if (!thread || newQty < 0) return;
    setQuantityLoading(true);
    const { data } = await updateThreadInventoryItem(id, { quantity: newQty });
    if (data) setThread(data);
    setQuantityLoading(false);
  };

  const handleEdit = async (
    values: Omit<ThreadInventoryItem, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    setSubmitting(true);
    const { data } = await updateThreadInventoryItem(id, values);
    if (data) { setThread(data); setEditing(false); toast.success("Thread updated!"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteThreadInventoryItem(id);
    toast.success("Thread deleted");
    router.push("/threads");
  };

  const loading = thread === undefined;

  if (loading) {
    return (
      <>
        <TopBar title="Thread" showBack backHref="/threads" />
        <PageWrapper>
          <Skeleton className="h-36 mb-4" />
          <Skeleton className="h-24 mb-3" />
          <Skeleton className="h-24" />
        </PageWrapper>
      </>
    );
  }

  if (!thread) {
    return (
      <>
        <TopBar title="Thread" showBack backHref="/threads" />
        <PageWrapper>
          <div className="text-center py-16">
            <p className="font-nunito text-[#6B544D]">Thread not found.</p>
          </div>
        </PageWrapper>
      </>
    );
  }

  const threadTypeLabel =
    thread.thread_type
      ? thread.thread_type.charAt(0).toUpperCase() + thread.thread_type.slice(1)
      : null;

  return (
    <>
      <TopBar
        title={thread.color_name ?? thread.color_number ?? "Thread"}
        showBack
        backHref="/threads"
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
              className="font-nunito font-semibold text-[14px] text-[#6B544D]"
            >
              Cancel
            </button>
          )
        }
      />
      <PageWrapper className="pb-10">
        {editing ? (
          <ThreadForm
            mode="edit"
            initial={thread}
            onSubmit={handleEdit}
            submitting={submitting}
          />
        ) : (
          <>
            {/* Thread info card */}
            <div
              className="bg-white border border-[#E4D6C8] rounded-2xl p-5 mb-4"
              style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-[#FDF4F1] flex flex-col items-center justify-center gap-1 flex-shrink-0">
                  <span className="text-2xl">🧵</span>
                  {thread.color_number && (
                    <span className="font-nunito font-bold text-[11px] text-[#B36050]">
                      {thread.color_number}
                    </span>
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-playfair font-bold text-[18px] text-[#3A2418] leading-tight">
                    {thread.color_name ?? thread.color_number ?? "Unnamed thread"}
                  </p>
                  <p className="font-nunito text-[13px] text-[#6B544D] mt-0.5">
                    {thread.manufacturer}
                    {threadTypeLabel ? ` · ${threadTypeLabel}` : ""}
                  </p>
                  {thread.color_number && thread.color_name && (
                    <p className="font-nunito text-[12px] text-[#9A8578] mt-0.5">
                      #{thread.color_number}
                    </p>
                  )}
                </div>
              </div>

              {thread.notes && (
                <p className="font-nunito text-[13px] text-[#6B544D] mt-4 pt-4 border-t border-[#F0E6DC]">
                  {thread.notes}
                </p>
              )}
            </div>

            {/* Quantity control */}
            <div
              className="bg-white border border-[#E4D6C8] rounded-2xl p-5 mb-4"
              style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
            >
              <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-3">
                Quantity in Stash
              </p>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => updateQuantity(thread.quantity - 1)}
                  disabled={thread.quantity === 0 || quantityLoading}
                  className="w-12 h-12 rounded-full border-2 border-[#E4D6C8] bg-white text-[#B36050] font-bold text-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                >
                  −
                </button>
                <span className="font-nunito font-bold text-[36px] text-[#3A2418] tabular-nums w-16 text-center">
                  {thread.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(thread.quantity + 1)}
                  disabled={quantityLoading}
                  className="w-12 h-12 rounded-full border-2 border-[#B36050] bg-[#B36050] text-white font-bold text-xl flex items-center justify-center active:scale-90 transition-transform"
                >
                  +
                </button>
                <span className="font-nunito text-[13px] text-[#6B544D]">
                  {thread.quantity === 1 ? "skein" : "skeins"}
                </span>
              </div>
            </div>

            {/* Patterns cross-reference */}
            {thread.color_number && (
              <div
                className="bg-white border border-[#E4D6C8] rounded-2xl p-5 mb-4"
                style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
              >
                <p className="font-nunito font-bold text-[13px] text-[#3A2418] mb-3">
                  Patterns using this thread
                </p>
                {patterns === null ? (
                  <Skeleton className="h-12" />
                ) : patterns.length === 0 ? (
                  <p className="font-nunito text-[13px] text-[#9A8578]">
                    None of your patterns call for this thread yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {patterns.map((p) => {
                      const badge = statusBadge(p);
                      return (
                        <Link
                          key={p.id}
                          href={`/patterns/${p.id}`}
                          className="flex items-center gap-3 py-2 border-b border-[#F0E6DC] last:border-0 active:opacity-70"
                        >
                          {/* Pattern thumb */}
                          <div className="w-10 h-10 rounded-xl bg-[#F5EEE8] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {p.cover_photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.cover_photo_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-lg opacity-30">📖</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-nunito font-bold text-[13px] text-[#3A2418] truncate">
                              {p.name}
                            </p>
                            {p.designer && (
                              <p className="font-nunito text-[11px] text-[#6B544D] truncate">
                                {p.designer}
                              </p>
                            )}
                          </div>
                          <span
                            className={`flex-shrink-0 px-2.5 py-0.5 rounded-full font-nunito text-[10px] font-bold ${badge.classes}`}
                          >
                            {badge.text}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Delete */}
            <div className="mt-4">
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full h-12 rounded-full border border-[#E4D6C8] font-nunito font-semibold text-[14px] text-[#6B544D] bg-white active:scale-[0.98] transition-transform"
                >
                  Remove from stash
                </button>
              ) : (
                <div className="bg-[#FDF0EE] border border-[#F0C8BB] rounded-2xl p-4 flex flex-col gap-3">
                  <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
                    Remove this thread?
                  </p>
                  <p className="font-nunito text-[13px] text-[#6B544D]">
                    This will remove it from your stash. This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 h-11 rounded-full border border-[#E4D6C8] font-nunito font-semibold text-[14px] text-[#6B544D] bg-white"
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
