import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";

export default function AIPage() {
  return (
    <>
      <TopBar title="AI Advisor" />
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3">
          <div className="text-5xl">✨</div>
          <p className="text-[#896E66] font-nunito">AI Advisor — Coming in Phase 9</p>
        </div>
      </PageWrapper>
    </>
  );
}
