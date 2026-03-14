"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPattern } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PatternDetail } from "@/components/patterns/PatternDetail";
import type { Pattern } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pattern, setPattern] = useState<Pattern | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getPattern(id).then(({ data }) => {
      setPattern(data ?? null);
    });
  }, [id]);

  if (pattern === undefined) {
    // Loading
    return (
      <>
        <TopBar title="" showBack />
        <PageWrapper>
          <Skeleton className="aspect-[4/3] w-full mb-5" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[60px]" />
            ))}
          </div>
        </PageWrapper>
      </>
    );
  }

  if (pattern === null) {
    return (
      <>
        <TopBar title="Pattern not found" showBack />
        <PageWrapper>
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <span className="text-5xl">😕</span>
            <p className="font-nunito font-bold text-[15px] text-[#3A2418]">
              Pattern not found
            </p>
            <p className="font-nunito text-[13px] text-[#896E66]">
              It may have been deleted.
            </p>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <TopBar title={pattern.name} showBack />
      <PageWrapper>
        <PatternDetail initialPattern={pattern} />
      </PageWrapper>
    </>
  );
}
