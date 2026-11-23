import { create } from 'zustand';
import type { Script, StudioConfig } from '@/types';
import { DEFAULT_VOICE } from '@/lib/tts/voices';

interface AppState {
  studio: StudioConfig | null;
  activeScript: Script | null;
  onboardingDismissed: boolean;
  setStudio: (studio: StudioConfig | null) => void;
  setActiveScript: (script: Script | null) => void;
  setOnboardingDismissed: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  studio: null,
  activeScript: null,
  onboardingDismissed: false,
  setStudio: (studio) => set({ studio }),
  setActiveScript: (activeScript) => set({ activeScript }),
  setOnboardingDismissed: (onboardingDismissed) => set({ onboardingDismissed }),
}));

export function emptyScript(): Script {
  const now = Date.now();
  return {
    id: `script_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Untitled script',
    blocks: [
      {
        id: `blk_${now.toString(36)}_1`,
        type: 'line',
        text: 'Hello from Shryne Studio.',
        voice: DEFAULT_VOICE,
        speed: 1,
        enabled: true,
      },
    ],
    characters: [],
    defaultVoice: DEFAULT_VOICE,
    defaultSpeed: 1,
    outputDir: 'tts-output',
    createdAt: now,
    updatedAt: now,
  };
}
