import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { KitForm } from "@/components/kits/KitForm";

export default function NewKitPage() {
  return (
    <>
      <TopBar title="Add a Kit" showBack />
      <PageWrapper>
        <KitForm mode="create" />
      </PageWrapper>
    </>
  );
}
