import { FATHAH, HIJAIYAH, learnLanguage } from "@/constants/hijaiyah";
import { buildQuiz, hasPassed, LESSON_SIZE, LEVEL_1, lessonById, QUIZ_LENGTH, readingRows, seededRandom } from "../learnRead";

describe("hijaiyah letters", () => {
    it("has the 28 letters once each, each read with fathah", () => {
        expect(HIJAIYAH).toHaveLength(28);
        expect(new Set(HIJAIYAH.map((letter) => letter.id)).size).toBe(28);
        expect(new Set(HIJAIYAH.map((letter) => letter.letter)).size).toBe(28);
        for (const letter of HIJAIYAH) expect(letter.fathah.endsWith(FATHAH)).toBe(true);
    });

    it("writes alif's fathah on hamzah, since a bare alif carries no vowel", () => {
        expect(HIJAIYAH[0].fathah).toBe("أ" + FATHAH);
    });

    it("picks Indonesian spellings only for Indonesian", () => {
        expect(learnLanguage("id")).toBe("id");
        expect(learnLanguage("id-ID")).toBe("id");
        expect(learnLanguage("en")).toBe("en");
        expect(learnLanguage("ms")).toBe("en");
    });
});

describe("level 1 lessons", () => {
    it("covers every letter once, in order, a few at a time", () => {
        expect(LEVEL_1.flatMap((lesson) => lesson.letters)).toEqual(HIJAIYAH);
        for (const lesson of LEVEL_1) expect(lesson.letters.length).toBeLessThanOrEqual(LESSON_SIZE);
    });

    it("knows every letter up to and including its own", () => {
        const third = LEVEL_1[2];
        expect(third.known).toEqual(HIJAIYAH.slice(0, 3 * LESSON_SIZE));
        expect(LEVEL_1[LEVEL_1.length - 1].known).toEqual(HIJAIYAH);
    });

    it("finds a lesson by id", () => {
        expect(lessonById("1-2")?.number).toBe(2);
        expect(lessonById("9-9")).toBeUndefined();
    });
});

describe("reading rows", () => {
    it("starts with the new letters in order, then reversed", () => {
        const lesson = LEVEL_1[1];
        const rows = readingRows(lesson, seededRandom(1));
        expect(rows[0]).toEqual(lesson.letters);
        expect(rows[1]).toEqual([...lesson.letters].reverse());
    });

    it("only uses letters already learned, and every row practises a new one", () => {
        for (const lesson of LEVEL_1) {
            const known = new Set(lesson.known.map((letter) => letter.id));
            const fresh = new Set(lesson.letters.map((letter) => letter.id));
            for (const row of readingRows(lesson, seededRandom(lesson.number))) {
                expect(row.every((letter) => known.has(letter.id))).toBe(true);
                expect(row.some((letter) => fresh.has(letter.id))).toBe(true);
            }
        }
    });

    it("adds review rows only once there are earlier letters", () => {
        expect(readingRows(LEVEL_1[0], seededRandom(1))).toHaveLength(4);
        expect(readingRows(LEVEL_1[1], seededRandom(1))).toHaveLength(6);
    });

    it("never repeats a row within a lesson", () => {
        for (const lesson of LEVEL_1) {
            for (let seed = 0; seed < 30; seed++) {
                const keys = readingRows(lesson, seededRandom(seed)).map((row) => row.map((letter) => letter.id).join(" "));
                expect(new Set(keys).size).toBe(keys.length);
            }
        }
    });

    it("gives the same rows for the same seed", () => {
        expect(readingRows(LEVEL_1[3], seededRandom(42))).toEqual(readingRows(LEVEL_1[3], seededRandom(42)));
    });
});

describe("quiz", () => {
    it.each(["en", "id"] as const)("asks every new letter, with four distinct-looking options including the answer (%s)", (language) => {
        for (const lesson of LEVEL_1) {
            for (let seed = 0; seed < 20; seed++) {
                const quiz = buildQuiz(lesson, language, seededRandom(seed));
                expect(quiz).toHaveLength(QUIZ_LENGTH);
                for (const letter of lesson.letters) expect(quiz.some((question) => question.answer.id === letter.id)).toBe(true);

                for (const question of quiz) {
                    expect(question.options).toHaveLength(4);
                    expect(question.options.filter((option) => option.id === question.answer.id)).toHaveLength(1);
                    const shown = question.options.map((option) => (question.kind === "readSound" ? option.sound[language] : option.fathah));
                    expect(new Set(shown).size).toBe(4);
                }
            }
        }
    });

    it("only asks about letters the learner has met", () => {
        for (const lesson of LEVEL_1) {
            const known = new Set(lesson.known.map((letter) => letter.id));
            for (const question of buildQuiz(lesson, "en", seededRandom(7))) expect(known.has(question.answer.id)).toBe(true);
        }
    });

    it("never offers ha and ha as two options in Indonesian, where both are spelled the same", () => {
        // ح and ه are both written "ha" in Indonesian primers.
        const lesson = LEVEL_1[LEVEL_1.length - 1];
        for (let seed = 0; seed < 50; seed++) {
            for (const question of buildQuiz(lesson, "id", seededRandom(seed))) {
                if (question.kind !== "readSound") continue;
                const ids = question.options.map((option) => option.id);
                expect(ids.includes("ha") && ids.includes("haa")).toBe(false);
            }
        }
    });

    it("never asks the same letter twice in a row", () => {
        for (const lesson of LEVEL_1) {
            for (let seed = 0; seed < 50; seed++) {
                const quiz = buildQuiz(lesson, "en", seededRandom(seed));
                for (let i = 1; i < quiz.length; i++) expect(quiz[i].answer.id).not.toBe(quiz[i - 1].answer.id);
            }
        }
    });

    it("asks no letter more than twice", () => {
        for (const lesson of LEVEL_1) {
            for (let seed = 0; seed < 50; seed++) {
                const counts = new Map<string, number>();
                for (const question of buildQuiz(lesson, "en", seededRandom(seed))) counts.set(question.answer.id, (counts.get(question.answer.id) ?? 0) + 1);
                expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
            }
        }
    });

    it("mixes both question kinds", () => {
        const kinds = new Set(buildQuiz(LEVEL_1[2], "en", seededRandom(3)).map((question) => question.kind));
        expect(kinds).toEqual(new Set(["readSound", "findLetter"]));
    });
});

describe("passing", () => {
    it("needs 80%", () => {
        expect(hasPassed(7, 8)).toBe(true);
        expect(hasPassed(6, 8)).toBe(false);
        expect(hasPassed(0, 0)).toBe(false);
    });
});
