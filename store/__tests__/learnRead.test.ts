import { LEVEL_1 } from "@/services/learnRead";
import { nextLesson, nextOverallLesson, passedCount, totalPassedCount, useLearnReadStore } from "../learnRead";
import { storage } from "../storage";

const state = () => useLearnReadStore.getState();
const now = new Date("2026-10-14T10:00:00Z");

beforeEach(() => {
    storage.clearAll();
    useLearnReadStore.setState({ lessons: {} });
});

describe("quiz results", () => {
    it("records a pass with its date", () => {
        state().recordQuiz("1-1", 8, 8, now);
        expect(state().lessons["1-1"]).toEqual({ best: 1, passedAt: now.toISOString() });
    });

    it("keeps the best score and doesn't mark a lesson passed below 80%", () => {
        state().recordQuiz("1-1", 6, 8, now);
        state().recordQuiz("1-1", 4, 8, now);
        expect(state().lessons["1-1"]).toEqual({ best: 0.75 });
    });

    it("keeps the first pass date when the lesson is passed again", () => {
        state().recordQuiz("1-1", 7, 8, now);
        state().recordQuiz("1-1", 8, 8, new Date("2026-10-20T10:00:00Z"));
        expect(state().lessons["1-1"]).toEqual({ best: 1, passedAt: now.toISOString() });
    });

    it("stays passed after a weaker retry", () => {
        state().recordQuiz("1-1", 8, 8, now);
        state().recordQuiz("1-1", 2, 8, now);
        expect(state().lessons["1-1"].passedAt).toBe(now.toISOString());
    });

    it("ignores an empty quiz", () => {
        state().recordQuiz("1-1", 0, 0, now);
        expect(state().lessons).toEqual({});
    });
});

describe("progress", () => {
    it("counts passed lessons and points at the first unpassed one", () => {
        expect(passedCount(state().lessons)).toBe(0);
        expect(nextLesson(state().lessons)?.id).toBe("1-1");

        state().recordQuiz("1-1", 8, 8, now);
        state().recordQuiz("1-2", 5, 8, now);
        expect(passedCount(state().lessons)).toBe(1);
        expect(nextLesson(state().lessons)?.id).toBe("1-2");
    });

    it("has no next lesson once the level is done", () => {
        for (const lesson of LEVEL_1) state().recordQuiz(lesson.id, 8, 8, now);
        expect(passedCount(state().lessons)).toBe(LEVEL_1.length);
        expect(nextLesson(state().lessons)).toBeUndefined();
    });

    it("tracks progress across different levels independently", () => {
        state().recordQuiz("2-1", 8, 8, now);
        state().recordQuiz("3-1", 8, 8, now);
        expect(passedCount(state().lessons, 2)).toBe(1);
        expect(passedCount(state().lessons, 3)).toBe(1);
        expect(passedCount(state().lessons, 1)).toBe(0);
        expect(nextLesson(state().lessons, 2)?.id).toBe("2-2");
    });

    it("computes totalPassedCount and nextOverallLesson across all levels", () => {
        expect(totalPassedCount(state().lessons)).toBe(0);
        expect(nextOverallLesson(state().lessons)?.id).toBe("1-1");

        // Finish all level 1
        for (const lesson of LEVEL_1) state().recordQuiz(lesson.id, 8, 8, now);
        expect(totalPassedCount(state().lessons)).toBe(7);
        expect(nextOverallLesson(state().lessons)?.id).toBe("2-1");

        // Pass one in level 2
        state().recordQuiz("2-1", 8, 8, now);
        expect(totalPassedCount(state().lessons)).toBe(8);
        expect(nextOverallLesson(state().lessons)?.id).toBe("2-2");
    });
});

