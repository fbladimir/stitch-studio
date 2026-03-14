"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] z-50 bg-white border-r border-[#E4D6C8]"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1.5rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 mb-8">
        <span className="text-2xl" aria-hidden="true">🪡</span>
        <span className="font-playfair text-xl font-bold text-[#3A2418]">
          Stitch Studio
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-1 px-3">
        {NAV_ITEMS.map(({ href, icon: Icon, label, tutorialId }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              data-tutorial-id={tutorialId}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors min-h-[48px] ${
                isActive
                  ? "bg-[#FDF4F1] text-[#B36050]"
                  : "text-[#896E66] hover:bg-[#FAF6F0] hover:text-[#3A2418]"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                aria-hidden="true"
              />
              <span
                className={`text-sm font-nunito ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B36050]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
