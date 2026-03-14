"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getKit } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { KitForm } from "@/components/kits/KitForm";
import type { Pattern } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function EditKitPage() {
  const { id } = useParams<{ id: string }>();
  const [kit, setKit] = useState<Pattern | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getKit(id).then(({ data }) => {
      setKit(data ?? null);
    });
  }, [id]);

  if (kit === undefined) {
    return (
      <>
        <TopBar title="Edit Kit" showBack />
        <PageWrapper>
          <div className="flex flex-col gap-4">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
        </PageWrapper>
      </>
    );
  }

  if (kit === null) {
    return (
      <>
        <TopBar title="Kit not found" showBack />
        <PageWrapper>
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <span className="text-5xl">😕</span>
            <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
              Kit not found
            </p>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <TopBar title="Edit Kit" showBack />
      <PageWrapper>
        <KitForm mode="edit" initialData={kit} />
      </PageWrapper>
    </>
  );
}
