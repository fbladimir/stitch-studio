"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPatterns } from "@/lib/supabase/queries";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import type { Pattern } from "@/types";

export default function StitchingSelectPage() {
  const [wips, setWips] = useState<Pattern[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await getPatterns(user.id);
      const wipPatterns = (data ?? []).filter((p) => p.wip && !p.completion_date);
      setWips(wipPatterns);
    };
    load();
  }, []);

  return (
    <>
      <TopBar title="Stitching Mode" />
      <PageWrapper className="pb-8">
        <div className="pt-2">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl block mb-2">⏱️</span>
            <h1 className="font-playfair text-2xl font-bold text-[#3A2418]">
              Ready to Stitch?
            </h1>
            <p className="font-nunito text-[14px] text-[#6B544D] mt-1">
              Pick a project to start tracking your session
            </p>
          </div>

          {/* WIP list */}
          {wips === null ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-[76px]" />
              ))}
            </div>
          ) : wips.length === 0 ? (
            <div className="bg-white border border-[#E4D6C8] rounded-2xl px-5 py-8 text-center">
              <span className="text-3xl block mb-2">🪡</span>
              <p className="font-nunito font-bold text-[14px] text-[#3A2418]">
                No WIPs right now
              </p>
              <p className="font-nunito text-[12px] text-[#6B544D] mt-1">
                Open a pattern and toggle &ldquo;Work in Progress&rdquo; to start tracking.
              </p>
              <Link
                href="/patterns"
                className="inline-block mt-4 h-10 px-6 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[13px] leading-[40px] active:scale-95 transition-transform"
              >
                Go to Patterns
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {wips.map((p) => (
                <Link
                  key={p.id}
                  href={`/stitching/${p.id}`}
                  className="bg-white border border-[#E4D6C8] rounded-2xl flex items-center gap-3 pr-4 overflow-hidden active:scale-[0.98] transition-transform"
                  style={{ boxShadow: "0 2px 8px rgba(58,36,24,0.04)" }}
                >
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[72px] flex-shrink-0 bg-[#F5EEE8] flex items-center justify-center rounded-l-2xl overflow-hidden">
                    {p.cover_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_photo_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl opacity-40">📖</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 py-3 min-w-0">
                    <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate leading-tight">
                      {p.name}
                    </p>
                    {p.designer && (
                      <p className="font-nunito text-[11px] text-[#6B544D] mt-0.5 truncate">
                        {p.designer}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-block px-2 py-0.5 rounded-full font-nunito text-[10px] font-bold bg-[#FBF5E8] text-[#AE7C2A]">
                        WIP · {p.wip_pct}%
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#EBF2EC] flex items-center justify-center">
                    <span className="text-[#5F7A63] font-bold text-lg">▶</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
