import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { EmbroideryForm } from "@/components/embroidery/EmbroideryForm";

export default function NewEmbroideryPage() {
  return (
    <>
      <TopBar title="Add Embroidery Pattern" showBack />
      <PageWrapper>
        <EmbroideryForm mode="create" />
      </PageWrapper>
    </>
  );
}
