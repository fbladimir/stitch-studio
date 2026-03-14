"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightElement?: React.ReactNode;
}

export function TopBar({
  title,
  showBack = false,
  backHref,
  rightElement,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-sm border-b border-[#E4D6C8]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-2 px-4 h-14 md:pl-[236px]">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 rounded-full text-[#6B544D] hover:text-[#B36050] hover:bg-[#FDF4F1] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
        )}
        <h1 className="font-playfair text-xl font-bold text-[#3A2418] flex-1 truncate">
          {title}
        </h1>
        {rightElement && (
          <div className="flex items-center gap-2">{rightElement}</div>
        )}
      </div>
    </header>
  );
}
