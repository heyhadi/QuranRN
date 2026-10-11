import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deleteSurahAudio, downloadSurahAudio } from "@/services/audioDownloads";
import { zustandStorage } from "./storage";

export const downloadKey = (reciterId: string, surahNumber: number) => `${reciterId}:${surahNumber}`;

export interface ActiveDownload {
    done: number;
    total: number;
    failed: boolean;
}

interface DownloadsState {
    /** Surahs fully downloaded, by reciter:surah. */
    completed: Record<string, true>;
    /** Downloads running now (not saved). */
    active: Record<string, ActiveDownload>;
    download: (reciterId: string, surahNumber: number, ayahCount: number) => Promise<void>;
    cancel: (reciterId: string, surahNumber: number) => void;
    remove: (reciterId: string, surahNumber: number) => void;
}

const cancelled = new Set<string>();

export const useDownloadsStore = create<DownloadsState>()(
    persist(
        (set, get) => ({
            completed: {},
            active: {},

            download: async (reciterId, surahNumber, ayahCount) => {
                const key = downloadKey(reciterId, surahNumber);
                if (get().active[key]) return;
                cancelled.delete(key);
                set((state) => ({ active: { ...state.active, [key]: { done: 0, total: ayahCount, failed: false } } }));
                const finish = (outcome: "done" | "failed" | "cancelled") =>
                    set((state) => {
                        const { [key]: _finished, ...active } = state.active;
                        if (outcome === "failed") return { active: { ...active, [key]: { done: _finished?.done ?? 0, total: ayahCount, failed: true } } };
                        return { active, completed: outcome === "done" ? { ...state.completed, [key]: true as const } : state.completed };
                    });
                try {
                    await downloadSurahAudio({
                        reciterId,
                        surahNumber,
                        ayahCount,
                        onProgress: (done) => set((state) => ({ active: { ...state.active, [key]: { done, total: ayahCount, failed: false } } })),
                        shouldCancel: () => cancelled.has(key),
                    });
                    finish(cancelled.has(key) ? "cancelled" : "done");
                } catch {
                    finish("failed");
                }
            },

            cancel: (reciterId, surahNumber) => {
                cancelled.add(downloadKey(reciterId, surahNumber));
            },

            remove: (reciterId, surahNumber) => {
                deleteSurahAudio(reciterId, surahNumber);
                set((state) => {
                    const { [downloadKey(reciterId, surahNumber)]: _removed, ...completed } = state.completed;
                    return { completed };
                });
            },
        }),
        { name: "downloads", storage: zustandStorage, version: 1, partialize: (state) => ({ completed: state.completed }) },
    ),
);
