import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookmarkKey } from "./bookmarks";
import { zustandStorage } from "./storage";

/** The default practice reciter: Husary's slow teaching recitation, made for learning. */
export const DEFAULT_HIFZ_RECITER_ID = "husary-muallim";

export const HIFZ_REPEAT_OPTIONS = [1, 3, 5, 10] as const;
export const HIFZ_PAUSE_OPTIONS = [0, 2, 4] as const;

interface HifzState {
    /** Ayahs marked as memorized, keyed "surah:ayah". */
    memorized: Record<string, true>;
    reciterId: string;
    repeatEach: number;
    /** Silence between repeats, in seconds. */
    pauseSeconds: number;
    hideText: boolean;
    setMemorized: (surahNumber: number, ayahNumber: number, value: boolean) => void;
    setRangeMemorized: (surahNumber: number, from: number, to: number, value: boolean) => void;
    setReciterId: (reciterId: string) => void;
    setRepeatEach: (times: number) => void;
    setPauseSeconds: (seconds: number) => void;
    setHideText: (hide: boolean) => void;
}

export const useHifzStore = create<HifzState>()(
    persist(
        (set) => ({
            memorized: {},
            reciterId: DEFAULT_HIFZ_RECITER_ID,
            repeatEach: 3,
            pauseSeconds: 2,
            hideText: false,

            setMemorized: (surahNumber, ayahNumber, value) =>
                set((state) => {
                    const key = bookmarkKey(surahNumber, ayahNumber);
                    if (value) return { memorized: { ...state.memorized, [key]: true as const } };
                    const { [key]: _removed, ...rest } = state.memorized;
                    return { memorized: rest };
                }),

            setRangeMemorized: (surahNumber, from, to, value) =>
                set((state) => {
                    const memorized = { ...state.memorized };
                    for (let ayah = Math.min(from, to); ayah <= Math.max(from, to); ayah++) {
                        const key = bookmarkKey(surahNumber, ayah);
                        if (value) memorized[key] = true;
                        else delete memorized[key];
                    }
                    return { memorized };
                }),

            setReciterId: (reciterId) => set({ reciterId }),
            setRepeatEach: (repeatEach) => set({ repeatEach }),
            setPauseSeconds: (pauseSeconds) => set({ pauseSeconds }),
            setHideText: (hideText) => set({ hideText }),
        }),
        { name: "hifz", storage: zustandStorage, version: 1 },
    ),
);

/** How many ayahs of a Surah are marked memorized. */
export function memorizedCount(memorized: Record<string, true>, surahNumber: number): number {
    const prefix = `${surahNumber}:`;
    return Object.keys(memorized).filter((key) => key.startsWith(prefix)).length;
}

/** The Surahs that have at least one memorized ayah, with their counts. */
export function surahsInProgress(memorized: Record<string, true>): { surahNumber: number; count: number }[] {
    const counts = new Map<number, number>();
    for (const key of Object.keys(memorized)) {
        const surah = Number(key.split(":")[0]);
        counts.set(surah, (counts.get(surah) ?? 0) + 1);
    }
    return [...counts].map(([surahNumber, count]) => ({ surahNumber, count })).sort((a, b) => a.surahNumber - b.surahNumber);
}
