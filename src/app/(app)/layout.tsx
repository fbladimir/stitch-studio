import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { InstallBanner } from "@/components/layout/InstallBanner";
import { CelebrationOverlay } from "@/components/engagement/CelebrationOverlay";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#FAF6F0]">
      <SideNav />
      <BottomNav />
      <InstallBanner />
      <CelebrationOverlay />
      <TutorialOverlay />
      {children}
    </div>
  );
}
