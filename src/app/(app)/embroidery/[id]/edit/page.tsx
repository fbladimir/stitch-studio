"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEmbroidery } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { EmbroideryForm } from "@/components/embroidery/EmbroideryForm";
import type { Pattern } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function EditEmbroideryPage() {
  const { id } = useParams<{ id: string }>();
  const [embroidery, setEmbroidery] = useState<Pattern | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getEmbroidery(id).then(({ data }) => {
      setEmbroidery(data ?? null);
    });
  }, [id]);

  if (embroidery === undefined) {
    return (
      <>
        <TopBar title="Edit Embroidery" showBack />
        <PageWrapper>
          <div className="flex flex-col gap-4">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[140px]" />
          </div>
        </PageWrapper>
      </>
    );
  }

  if (embroidery === null) {
    return (
      <>
        <TopBar title="Not found" showBack />
        <PageWrapper>
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <span className="text-5xl">😕</span>
            <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
              Pattern not found
            </p>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <TopBar title="Edit Embroidery" showBack />
      <PageWrapper>
        <EmbroideryForm mode="edit" initialData={embroidery} />
      </PageWrapper>
    </>
  );
}
