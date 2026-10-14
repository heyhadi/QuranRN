import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hasPassed, lessonsForLevel, LEVEL_1, type Lesson, type LessonLevel } from "@/services/learnRead";
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

/** How many lessons in a level have a passed quiz. Defaults to level 1. */
export function passedCount(lessons: Record<string, LessonProgress>, level: LessonLevel = 1): number {
    const list = lessonsForLevel(level);
    return list.filter((lesson) => lessons[lesson.id]?.passedAt).length;
}

/** The first lesson in a level not passed yet, or undefined once the level is done. Defaults to level 1. */
export function nextLesson(lessons: Record<string, LessonProgress>, level: LessonLevel = 1): Lesson | undefined {
    const list = lessonsForLevel(level);
    return list.find((lesson) => !lessons[lesson.id]?.passedAt);
}

/** Total lessons passed across all levels. */
export function totalPassedCount(lessons: Record<string, LessonProgress>): number {
    return Object.values(lessons).filter((p) => p.passedAt).length;
}

export const TOTAL_LESSONS = 29;

/** The next unpassed lesson across all levels (1 to 5), or undefined once all levels are done. */
export function nextOverallLesson(lessons: Record<string, LessonProgress>): Lesson | undefined {
    for (const lvl of [1, 2, 3, 4, 5] as const) {
        const next = nextLesson(lessons, lvl);
        if (next) return next;
    }
    return undefined;
}


