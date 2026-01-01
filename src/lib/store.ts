import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
    hevyApiKey: string | null;
    openAiApiKey: string | null;
    setHevyApiKey: (key: string) => void;
    setOpenAiApiKey: (key: string) => void;
    isSettingsOpen: boolean;
    setSettingsOpen: (isOpen: boolean) => void;
    trainingPhilosophy: string;
    setTrainingPhilosophy: (text: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hevyApiKey: null,
            openAiApiKey: null,
            setHevyApiKey: (key) => set({ hevyApiKey: key }),
            setOpenAiApiKey: (key) => set({ openAiApiKey: key }),
            isSettingsOpen: false,
            setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
            trainingPhilosophy: "",
            setTrainingPhilosophy: (text) => set({ trainingPhilosophy: text }),
        }),
        {
            name: 'hevy-spotter-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                hevyApiKey: state.hevyApiKey,
                openAiApiKey: state.openAiApiKey,
                trainingPhilosophy: state.trainingPhilosophy
            }),
        }
    )
);
