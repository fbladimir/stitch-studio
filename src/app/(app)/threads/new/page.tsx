"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createThreadInventoryItem } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { ThreadForm } from "@/components/threads/ThreadForm";
import type { ThreadInventoryItem } from "@/types";

export default function NewThreadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    values: Omit<ThreadInventoryItem, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in."); return; }

      const { error: err } = await createThreadInventoryItem(user.id, values);
      if (err) { setError(err.message); return; }
      router.push("/threads");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="Add Thread" showBack backHref="/threads" />
      <PageWrapper className="pb-10">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-[#FDF0EE] border border-[#F0C8BB]">
            <p className="font-nunito text-[13px] text-[#B03020]">{error}</p>
          </div>
        )}
        <ThreadForm mode="add" onSubmit={handleSubmit} submitting={submitting} />
      </PageWrapper>
    </>
  );
}
