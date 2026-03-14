import { create } from "zustand";
import type { Profile, CelebrationData } from "@/types";

interface AppState {
  profile: Profile | null;
  storeModeActive: boolean;
  // Engagement (Phase 15)
  celebrationQueue: CelebrationData[];
  setProfile: (profile: Profile | null) => void;
  setStoreModeActive: (active: boolean) => void;
  pushCelebration: (celebration: CelebrationData) => void;
  pushCelebrations: (celebrations: CelebrationData[]) => void;
  popCelebration: () => void;
  clearCelebrations: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  storeModeActive: false,
  celebrationQueue: [],
  setProfile: (profile) => set({ profile }),
  setStoreModeActive: (active) => set({ storeModeActive: active }),
  pushCelebration: (celebration) =>
    set((s) => ({ celebrationQueue: [...s.celebrationQueue, celebration] })),
  pushCelebrations: (celebrations) =>
    set((s) => ({ celebrationQueue: [...s.celebrationQueue, ...celebrations] })),
  popCelebration: () =>
    set((s) => ({ celebrationQueue: s.celebrationQueue.slice(1) })),
  clearCelebrations: () => set({ celebrationQueue: [] }),
}));
