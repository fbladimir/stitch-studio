import { create } from "zustand";
import type { Profile } from "@/types";

interface AppState {
  profile: Profile | null;
  storeModeActive: boolean;
  setProfile: (profile: Profile | null) => void;
  setStoreModeActive: (active: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  storeModeActive: false,
  setProfile: (profile) => set({ profile }),
  setStoreModeActive: (active) => set({ storeModeActive: active }),
}));
