"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPattern } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PatternForm } from "@/components/patterns/PatternForm";
import type { Pattern } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function EditPatternPage() {
  const { id } = useParams<{ id: string }>();
  const [pattern, setPattern] = useState<Pattern | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getPattern(id).then(({ data }) => {
      setPattern(data ?? null);
    });
  }, [id]);

  if (pattern === undefined) {
    return (
      <>
        <TopBar title="Edit Pattern" showBack />
        <PageWrapper>
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        </PageWrapper>
      </>
    );
  }

  if (pattern === null) {
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
      <TopBar title="Edit Pattern" showBack />
      <PageWrapper>
        <PatternForm mode="edit" initialData={pattern} />
      </PageWrapper>
    </>
  );
}
