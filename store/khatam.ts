import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addToIntervals, countCovered, dateKey, globalAyahIndex, type Interval } from "@/services/khatam";
import { zustandStorage } from "./storage";

export interface KhatamPlan {
    /** "YYYY-MM-DD", the day the plan began. */
    startDate: string;
    targetDays: number;
}

interface KhatamState {
    plan: KhatamPlan | null;
    /** Ayahs read in this round, as sorted intervals of positions in the whole Quran (1 to 6,236). */
    read: Interval[];
    /** New ayahs read each day, "YYYY-MM-DD" → count; drives the daily goal and the streak. */
    log: Record<string, number>;
    completedRounds: number;
    startPlan: (targetDays: number, today?: Date) => void;
    /** Stop the plan, keeping what has been read. */
    stopPlan: () => void;
    /** Record ayahs of a Surah that were on screen. Only ayahs not read before add to today's count. */
    recordRead: (surahNumber: number, ayahNumbers: number[], today?: Date) => void;
    /** Begin a new round: clears this round's progress, keeps the daily log and streak. */
    startNewRound: () => void;
}

export const useKhatamStore = create<KhatamState>()(
    persist(
        (set, get) => ({
            plan: null,
            read: [],
            log: {},
            completedRounds: 0,

            startPlan: (targetDays, today = new Date()) => set({ plan: { startDate: dateKey(today), targetDays } }),

            stopPlan: () => set({ plan: null }),

            recordRead: (surahNumber, ayahNumbers, today = new Date()) => {
                if (ayahNumbers.length === 0) return;
                const before = countCovered(get().read);
                const read = addToIntervals(
                    get().read,
                    ayahNumbers.map((ayah) => globalAyahIndex(surahNumber, ayah)),
                );
                const added = countCovered(read) - before;
                if (added <= 0) return;
                const key = dateKey(today);
                set((state) => ({ read, log: { ...state.log, [key]: (state.log[key] ?? 0) + added } }));
            },

            startNewRound: () => set((state) => ({ read: [], completedRounds: state.completedRounds + 1, plan: state.plan ? { ...state.plan, startDate: dateKey(new Date()) } : null })),
        }),
        { name: "khatam", storage: zustandStorage, version: 1 },
    ),
);

export function useReadCount(): number {
    return useKhatamStore((state) => countCovered(state.read));
}
