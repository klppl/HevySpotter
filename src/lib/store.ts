import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
    settingsOpen: boolean;
    hevyApiKey: string | null;
    openAiApiKey: string | null;
    trainingPhilosophy: string | null;
    selectedTemplateId: string;

    setSettingsOpen: (open: boolean) => void;
    setHevyApiKey: (key: string | null) => void;
    setOpenAiApiKey: (key: string | null) => void;
    setTrainingPhilosophy: (text: string) => void;
    setSelectedTemplateId: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            settingsOpen: false,
            hevyApiKey: null,
            openAiApiKey: null,
            trainingPhilosophy: null,
            selectedTemplateId: "drill-sergeant",

            setSettingsOpen: (open) => set({ settingsOpen: open }),
            setHevyApiKey: (key) => set({ hevyApiKey: key }),
            setOpenAiApiKey: (key) => set({ openAiApiKey: key }),
            setTrainingPhilosophy: (text) => set({ trainingPhilosophy: text }),
            setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
        }),
        {
            name: 'hevy-spotter-storage',
        }
    )
);
