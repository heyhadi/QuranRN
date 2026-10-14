import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hasPassed, LEVEL_1, type Lesson } from "@/services/learnRead";
import { zustandStorage } from "./storage";

export interface LessonProgress {
    /** Best quiz result so far, from 0 to 1. */
    best: number;
    /** When the quiz was first passed, as an ISO date; absent until then. */
    passedAt?: string;
}

interface LearnReadState {
    /** Keyed by lesson id ("1-3"). */
    lessons: Record<string, LessonProgress>;
    recordQuiz: (lessonId: string, correct: number, total: number, now?: Date) => void;
    reset: () => void;
}

export const useLearnReadStore = create<LearnReadState>()(
    persist(
        (set) => ({
            lessons: {},

            recordQuiz: (lessonId, correct, total, now = new Date()) =>
                set((state) => {
                    if (total <= 0) return state;
                    const previous = state.lessons[lessonId];
                    const score = correct / total;
                    const passedAt = previous?.passedAt ?? (hasPassed(correct, total) ? now.toISOString() : undefined);
                    const next: LessonProgress = { best: Math.max(previous?.best ?? 0, score), ...(passedAt ? { passedAt } : {}) };
                    return { lessons: { ...state.lessons, [lessonId]: next } };
                }),

            reset: () => set({ lessons: {} }),
        }),
        { name: "learn-read", storage: zustandStorage, version: 1 },
    ),
);

/** How many level 1 lessons have a passed quiz. */
export function passedCount(lessons: Record<string, LessonProgress>): number {
    return LEVEL_1.filter((lesson) => lessons[lesson.id]?.passedAt).length;
}

/** The first lesson not passed yet, or undefined once the level is done. */
export function nextLesson(lessons: Record<string, LessonProgress>): Lesson | undefined {
    return LEVEL_1.find((lesson) => !lessons[lesson.id]?.passedAt);
}
