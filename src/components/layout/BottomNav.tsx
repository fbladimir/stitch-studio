"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#E4D6C8] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label, tutorialId }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              data-tutorial-id={tutorialId}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] transition-colors ${
                isActive ? "text-[#B36050]" : "text-[#896E66]"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] font-nunito ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
