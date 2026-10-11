import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dateKey } from "@/services/khatam";
import { zustandStorage } from "./storage";

export const TASBIH_TARGETS = [33, 99, 100] as const;

interface TasbihState {
    count: number;
    target: number;
    /** Counts per day, "YYYY-MM-DD" → total taps. */
    history: Record<string, number>;
    /** Add one. Returns true when this tap reached the target or a multiple of 33, so the screen can vibrate. */
    tap: (today?: Date) => boolean;
    reset: () => void;
    setTarget: (target: number) => void;
}

export const useTasbihStore = create<TasbihState>()(
    persist(
        (set, get) => ({
            count: 0,
            target: 33,
            history: {},
            tap: (today = new Date()) => {
                const count = get().count + 1;
                const key = dateKey(today);
                set((state) => ({ count, history: { ...state.history, [key]: (state.history[key] ?? 0) + 1 } }));
                return count % get().target === 0 || count % 33 === 0;
            },
            reset: () => set({ count: 0 }),
            setTarget: (target) => set({ target, count: 0 }),
        }),
        { name: "tasbih", storage: zustandStorage, version: 1 },
    ),
);
