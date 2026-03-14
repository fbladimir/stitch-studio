"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Step1Name } from "./Step1Name";
import { Step2Photo } from "./Step2Photo";
import { Step3Dogs } from "./Step3Dogs";
import { createClient } from "@/lib/supabase/client";
import type { Dog } from "@/types";

interface OnboardingWizardProps {
  userId: string;
  initialName: string;
}

export function OnboardingWizard({ userId, initialName }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(initialName);

  async function handleStep1(name: string) {
    setDisplayName(name);
    setStep(2);
  }

  async function handleStep2(photoUrl: string | null) {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ display_name: displayName, profile_photo_url: photoUrl })
      .eq("id", userId);
    setStep(3);
  }

  async function handleStep3(dogs: Dog[]) {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ dogs, onboarding_complete: true })
      .eq("id", userId);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 bg-[#E4D6C8]">
        <div
          className="h-full bg-gradient-to-r from-[#B36050] to-[#CA8070] transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 pt-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step
                ? "w-6 bg-[#B36050]"
                : s < step
                ? "w-2 bg-[#CA8070]"
                : "w-2 bg-[#E4D6C8]"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {step === 1 && (
            <Step1Name initialName={initialName} onNext={handleStep1} />
          )}
          {step === 2 && (
            <Step2Photo userId={userId} displayName={displayName} onNext={handleStep2} />
          )}
          {step === 3 && (
            <Step3Dogs onNext={handleStep3} />
          )}
        </div>
      </div>
    </div>
  );
}
