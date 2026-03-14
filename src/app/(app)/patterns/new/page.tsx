import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PatternForm } from "@/components/patterns/PatternForm";

export default function NewPatternPage() {
  return (
    <>
      <TopBar title="Add Pattern" showBack />
      <PageWrapper>
        <PatternForm mode="create" />
      </PageWrapper>
    </>
  );
}
