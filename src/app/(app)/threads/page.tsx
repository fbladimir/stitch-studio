import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";

export default function ThreadsPage() {
  return (
    <>
      <TopBar title="Stash" />
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3">
          <div className="text-5xl">🧵</div>
          <p className="text-[#896E66] font-nunito">Threads & Fabrics — Coming in Phase 7</p>
        </div>
      </PageWrapper>
    </>
  );
}
