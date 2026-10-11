import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./storage";

export interface LastRead {
    surahNumber: number;
    ayahNumber: number;
    surahNameLatin: string;
    updatedAt: number;
}

interface ReadingProgressState {
    lastRead: LastRead | null;
    setLastRead: (position: Omit<LastRead, "updatedAt">) => void;
}

export const useReadingProgressStore = create<ReadingProgressState>()(
    persist(
        (set) => ({
            lastRead: null,
            setLastRead: (position) => set({ lastRead: { ...position, updatedAt: Date.now() } }),
        }),
        { name: "reading-progress", storage: zustandStorage, version: 1 },
    ),
);
