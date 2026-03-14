"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFabricInventoryItem, updateFabricInventoryItem, uploadFabricPhoto } from "@/lib/supabase/queries";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { FabricForm } from "@/components/fabrics/FabricForm";
import type { FabricInventoryItem } from "@/types";

export default function NewFabricPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    values: Omit<FabricInventoryItem, "id" | "user_id" | "created_at">,
    photoFile: File | null
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in."); return; }

      const { data: created, error: createErr } = await createFabricInventoryItem(user.id, values);
      if (createErr || !created) { setError(createErr?.message ?? "Failed to save."); return; }

      if (photoFile) {
        const { url } = await uploadFabricPhoto(user.id, created.id, photoFile);
        if (url) await updateFabricInventoryItem(created.id, { photo_url: url });
      }

      toast.success("Fabric added to your stash!");
      router.push(`/fabrics/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="Add Fabric" showBack backHref="/fabrics" />
      <PageWrapper className="pb-10">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-[#FDF0EE] border border-[#F0C8BB]">
            <p className="font-nunito text-[13px] text-[#B03020]">{error}</p>
          </div>
        )}
        <FabricForm mode="add" onSubmit={handleSubmit} submitting={submitting} />
      </PageWrapper>
    </>
  );
}
