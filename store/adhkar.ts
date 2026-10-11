import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dateKey } from "@/services/khatam";
import type { AdhkarSetId } from "@/services/adhkar";
import { zustandStorage } from "./storage";

interface AdhkarState {
    /** The day the counts belong to, "YYYY-MM-DD". Counts start again each day. */
    day: string;
    /** Times recited today, keyed "<set>:<index>". */
    counts: Record<string, number>;
    /** Add one recitation, never above `repeat`. */
    recite: (set: AdhkarSetId, index: number, repeat: number, today?: Date) => number;
    resetSet: (set: AdhkarSetId, today?: Date) => void;
}

export const adhkarKey = (set: AdhkarSetId, index: number) => `${set}:${index}`;

/** The counts that still count: those recorded today. */
export function countsFor(state: Pick<AdhkarState, "day" | "counts">, today: Date): Record<string, number> {
    return state.day === dateKey(today) ? state.counts : {};
}

/** How many entries of a set are fully recited. */
export function completedIn(counts: Record<string, number>, set: AdhkarSetId, repeats: number[]): number {
    return repeats.filter((repeat, index) => (counts[adhkarKey(set, index)] ?? 0) >= repeat).length;
}

export const useAdhkarStore = create<AdhkarState>()(
    persist(
        (set, get) => ({
            day: dateKey(new Date()),
            counts: {},
            recite: (adhkarSet, index, repeat, today = new Date()) => {
                const counts = { ...countsFor(get(), today) };
                const key = adhkarKey(adhkarSet, index);
                counts[key] = Math.min(repeat, (counts[key] ?? 0) + 1);
                set({ day: dateKey(today), counts });
                return counts[key];
            },
            resetSet: (adhkarSet, today = new Date()) => {
                const counts = Object.fromEntries(Object.entries(countsFor(get(), today)).filter(([key]) => !key.startsWith(`${adhkarSet}:`)));
                set({ day: dateKey(today), counts });
            },
        }),
        { name: "adhkar", storage: zustandStorage, version: 1 },
    ),
);
