"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { KittingResult } from "@/components/ai/KittingResult";
import type { KittingCheckResult } from "@/components/ai/KittingResult";
import type { Pattern, PatternThread, ThreadInventoryItem, FabricInventoryItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  getPatterns,
  getPatternThreads,
  getThreadInventory,
  getFabricInventory,
  updatePattern,
} from "@/lib/supabase/queries";

type Step = "select" | "checking" | "result";

export default function KittingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Result state
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [kittingResult, setKittingResult] = useState<KittingCheckResult | null>(null);
  const [allInventoryThreads, setAllInventoryThreads] = useState<ThreadInventoryItem[]>([]);

  // Load patterns
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await getPatterns(user.id);
      // Only show patterns that have threads assigned
      setPatterns(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function runKittingCheck(pattern: Pattern) {
    setSelectedPattern(pattern);
    setStep("checking");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data in parallel
      const [threadsRes, inventoryRes, fabricRes] = await Promise.all([
        getPatternThreads(pattern.id),
        getThreadInventory(user.id),
        getFabricInventory(user.id),
      ]);

      const patternThreads: PatternThread[] = threadsRes.data ?? [];
      const inventory: ThreadInventoryItem[] = inventoryRes.data ?? [];
      const fabrics: FabricInventoryItem[] = fabricRes.data ?? [];

      setAllInventoryThreads(inventory);

      // Compare threads
      const threads_have: KittingCheckResult["threads_have"] = [];
      const threads_missing: PatternThread[] = [];

      for (const pt of patternThreads) {
        const match = inventory.find(
          (inv) =>
            inv.manufacturer?.toLowerCase() === pt.manufacturer?.toLowerCase() &&
            inv.color_number?.toLowerCase() === pt.color_number?.toLowerCase() &&
            inv.quantity > 0
        );

        if (match) {
          threads_have.push({ thread: pt, inventory: match });
        } else {
          threads_missing.push(pt);
        }
      }

      // Check fabric
      let fabric_match = false;
      let fabric_note: string | null = null;

      if (pattern.rec_fabric) {
        // Simple check: see if any fabric in inventory roughly matches
        const recFabric = pattern.rec_fabric.toLowerCase();
        const matchingFabric = fabrics.find((f) => {
          const desc = [f.fabric_type, f.count ? `${f.count} count` : "", f.color_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return (
            recFabric.includes(f.fabric_type || "") ||
            recFabric.includes(f.count || "") ||
            desc.includes(recFabric.split(" ")[0])
          );
        });

        if (matchingFabric) {
          fabric_match = true;
          fabric_note = `You have ${matchingFabric.fabric_type || "fabric"} ${matchingFabric.count ? matchingFabric.count + "ct" : ""} ${matchingFabric.color_name || ""} in your stash`.trim();
        } else {
          fabric_note = `Pattern recommends: ${pattern.rec_fabric} — not found in your fabric stash`;
        }
      }

      const is_ready = threads_missing.length === 0;

      setKittingResult({
        threads_have,
        threads_missing,
        fabric_match,
        fabric_note,
        is_ready,
      });
      setStep("result");
    } catch {
      setStep("select");
    }
  }

  async function handleMarkKitted() {
    if (!selectedPattern) return;
    await updatePattern(selectedPattern.id, {
      kitted: true,
      kitted_date: new Date().toISOString(),
    });
    router.push(`/patterns/${selectedPattern.id}`);
  }

  const filtered = patterns.filter((p) =>
    [p.name, p.designer, p.company]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar title="Kitting Check" />
      <PageWrapper>
        {/* Step: Select Pattern */}
        {step === "select" && (
          <div className="flex flex-col gap-4 pb-8">
            <div className="text-center py-4">
              <span className="text-4xl">🧺</span>
              <p className="font-playfair font-bold text-[18px] text-[#3A2418] mt-2">
                Kitting Check
              </p>
              <p className="font-nunito text-[13px] text-[#6B544D] mt-1">
                Select a pattern to check if you have all the threads and fabric
              </p>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input"
            />

            {/* Pattern list */}
            {loading ? (
              <div className="flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-nunito text-[13px] text-[#6B544D]">
                  {patterns.length === 0
                    ? "Add some patterns first, then come back to check your kitting!"
                    : "No patterns match your search"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => runKittingCheck(p)}
                    className="bg-white border border-[#E4D6C8] rounded-xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                  >
                    {p.cover_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_photo_url}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#FAF6F0] flex items-center justify-center flex-shrink-0">
                        <span className="text-xl opacity-30">📖</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-bold text-[14px] text-[#3A2418] truncate">
                        {p.name}
                      </p>
                      {p.designer && (
                        <p className="font-nunito text-[12px] text-[#6B544D] truncate">
                          {p.designer}
                        </p>
                      )}
                    </div>
                    {p.kitted && (
                      <span className="px-2 py-0.5 rounded-full bg-[#EBF2EC] font-nunito text-[10px] text-[#5F7A63] font-bold">
                        Kitted
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Checking */}
        {step === "checking" && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="w-10 h-10 border-3 border-[#E4D6C8] border-t-[#B36050] rounded-full animate-spin" />
            <p className="font-nunito font-semibold text-[14px] text-[#3A2418]">
              Checking your stash...
            </p>
            <p className="font-nunito text-[12px] text-[#6B544D]">
              Comparing threads and fabric for &ldquo;{selectedPattern?.name}&rdquo;
            </p>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && kittingResult && selectedPattern && (
          <div className="flex flex-col gap-4 pb-8">
            <KittingResult
              patternName={selectedPattern.name}
              result={kittingResult}
              allInventoryThreads={allInventoryThreads}
              onMarkKitted={
                kittingResult.is_ready && !selectedPattern.kitted
                  ? handleMarkKitted
                  : undefined
              }
            />

            <button
              onClick={() => {
                setStep("select");
                setKittingResult(null);
                setSelectedPattern(null);
              }}
              className="w-full h-11 rounded-full border border-[#E4D6C8] text-[#6B544D] font-nunito font-semibold text-[14px] active:scale-[0.98]"
            >
              Check another pattern
            </button>
          </div>
        )}
      </PageWrapper>
    </>
  );
}
