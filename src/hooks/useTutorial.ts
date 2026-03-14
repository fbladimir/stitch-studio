"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";

/** Tutorial step definitions */
export interface TutorialStep {
  targetId: string | null; // data-tutorial-id value, null = no spotlight (final step)
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

// Mobile steps: combine all 4 nav tabs into 1 step
const MOBILE_STEPS: TutorialStep[] = [
  {
    targetId: "greeting",
    title: "Your home base",
    description:
      "This is your dashboard — your name, your stats, everything at a glance. It all starts here!",
    position: "bottom",
  },
  {
    targetId: "quick-actions",
    title: "Your magic shortcuts",
    description:
      "Four shortcuts to your most-used features. Scan a pattern, check your stash, log progress, or head to the store!",
    position: "top",
  },
  {
    targetId: "recent-patterns",
    title: "Recently touched",
    description:
      "Your most recently updated patterns always appear here so you can jump right back in.",
    position: "top",
  },
  {
    targetId: "bottom-nav",
    title: "Your navigation",
    description:
      "Projects for your collection, Stash for threads & fabrics, Shop for in-store help, and AI for your stitching advisor.",
    position: "top",
  },
  {
    targetId: null,
    title: "You're all set!",
    description: "Happy stitching! ✿",
    position: "center",
  },
];

// Desktop/tablet steps: individual side nav items
const DESKTOP_STEPS: TutorialStep[] = [
  {
    targetId: "greeting",
    title: "Your home base",
    description:
      "This is your dashboard — your name, your stats, everything at a glance. It all starts here!",
    position: "bottom",
  },
  {
    targetId: "quick-actions",
    title: "Your magic shortcuts",
    description:
      "Four shortcuts to your most-used features. Scan a pattern, check your stash, log progress, or head to the store!",
    position: "top",
  },
  {
    targetId: "recent-patterns",
    title: "Recently touched",
    description:
      "Your most recently updated patterns always appear here so you can jump right back in.",
    position: "top",
  },
  {
    targetId: "nav-patterns",
    title: "Your collection",
    description:
      "Tap here to browse your full pattern, embroidery, and kit collection — all in one place.",
    position: "right",
  },
  {
    targetId: "nav-stash",
    title: "Thread & fabric stash",
    description:
      "Your thread and fabric inventory lives here. Know exactly what you own!",
    position: "right",
  },
  {
    targetId: "nav-shop",
    title: "In-store helper",
    description:
      "Tap this when you're at a craft store — scan charts, check your stash, and find nearby shops.",
    position: "right",
  },
  {
    targetId: "nav-ai",
    title: "Your AI advisor",
    description:
      "Ask anything about stitching, scan a color key, or get thread substitution suggestions.",
    position: "right",
  },
  {
    targetId: null,
    title: "You're all set!",
    description: "Happy stitching! ✿",
    position: "center",
  },
];

function getIsMobile() {
  if (typeof window === "undefined") return true;
  return window.innerWidth < 768;
}

export function useTutorial() {
  const router = useRouter();
  const isTutorialActive = useAppStore((s) => s.isTutorialActive);
  const tutorialStep = useAppStore((s) => s.tutorialStep);
  const setTutorialActive = useAppStore((s) => s.setTutorialActive);
  const setTutorialStep = useAppStore((s) => s.setTutorialStep);

  const isMobile = useMemo(getIsMobile, []);
  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;

  const currentStep =
    tutorialStep < steps.length ? steps[tutorialStep] : null;

  const totalSteps = steps.length;

  const nextStep = useCallback(() => {
    if (tutorialStep < steps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      completeTutorial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialStep, setTutorialStep, steps.length]);

  const completeTutorial = useCallback(async () => {
    setTutorialActive(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ tutorial_complete: true })
        .eq("id", user.id);
    }
  }, [setTutorialActive]);

  const skipTutorial = useCallback(async () => {
    setTutorialActive(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          tutorial_complete: true,
          tutorial_skipped_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  }, [setTutorialActive]);

  const startTutorial = useCallback(() => {
    setTutorialActive(true);
  }, [setTutorialActive]);

  const restartTutorial = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ tutorial_complete: false, tutorial_skipped_at: null })
        .eq("id", user.id);
    }
    setTutorialStep(0);
    router.push("/dashboard");
    // Small delay so dashboard mounts first
    setTimeout(() => {
      setTutorialActive(true);
    }, 800);
  }, [setTutorialActive, setTutorialStep, router]);

  return {
    isTutorialActive,
    tutorialStep,
    currentStep,
    totalSteps,
    steps,
    nextStep,
    skipTutorial,
    completeTutorial,
    startTutorial,
    restartTutorial,
  };
}
