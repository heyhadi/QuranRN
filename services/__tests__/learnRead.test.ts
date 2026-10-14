import { FATHAH, HIJAIYAH, learnLanguage } from "@/constants/hijaiyah";
import { buildQuiz, hasPassed, LESSON_SIZE, LEVEL_1, LEVEL_2, lessonById, lessonsForLevel, QUIZ_LENGTH, readingRows, seededRandom } from "../learnRead";
import { hasClip } from "../learnReadAudio";

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

describe("advanced levels and harakat", () => {
    it("provides kasrah and dammah with correct Arabic marks and sounds for every letter", () => {
        for (const letter of HIJAIYAH) {
            expect(letter.kasrah).toBeDefined();
            expect(letter.dammah).toBeDefined();
            expect(letter.soundKasrah.en.length).toBeGreaterThan(0);
            expect(letter.soundDammah.en.length).toBeGreaterThan(0);
            expect(letter.soundKasrah.id.length).toBeGreaterThan(0);
            expect(letter.soundDammah.id.length).toBeGreaterThan(0);
        }
    });

    it("has isolated, initial, medial, and final letter shapes for every letter", () => {
        for (const letter of HIJAIYAH) {
            expect(letter.forms.isolated).toBeDefined();
            expect(letter.forms.initial).toBeDefined();
            expect(letter.forms.medial).toBeDefined();
            expect(letter.forms.final).toBeDefined();
        }
    });

    it("correctly marks non-connecting letters", () => {
        const nonConnectingIds = HIJAIYAH.filter((l) => l.nonConnecting).map((l) => l.id);
        expect(nonConnectingIds).toEqual(["alif", "dal", "dhal", "ra", "zay", "waw"]);
    });

    it("provides articulation makhraj descriptions for both English and Indonesian", () => {
        for (const letter of HIJAIYAH) {
            expect(letter.makhraj.en.length).toBeGreaterThan(5);
            expect(letter.makhraj.id.length).toBeGreaterThan(5);
        }
    });

    it("contains levels 1 through 5 with valid lesson structures", () => {
        expect(lessonsForLevel(1).length).toBe(7);
        expect(lessonsForLevel(2).length).toBe(7);
        expect(lessonsForLevel(3).length).toBe(7);
        expect(lessonsForLevel(4).length).toBe(4);
        expect(lessonsForLevel(5).length).toBe(4);

        expect(lessonById("2-1")?.level).toBe(2);
        expect(lessonById("3-1")?.level).toBe(3);
        expect(lessonById("4-1")?.level).toBe(4);
        expect(lessonById("5-1")?.level).toBe(5);
    });

    it("provides valid Quranic words in Level 5 with authentic Quran.com CDN audio URLs", () => {
        const level5 = lessonsForLevel(5);
        for (const lesson of level5) {
            expect(lesson.words).toBeDefined();
            expect(lesson.words!.length).toBeGreaterThan(0);
            for (const word of lesson.words!) {
                expect(word.arabic.length).toBeGreaterThan(0);
                expect(word.audioUrl).toMatch(/^https:\/\/audio\.qurancdn\.com\/wbw\/\d{3}_\d{3}_\d{3}\.mp3$/);
                expect(word.meaning.en.length).toBeGreaterThan(0);
                expect(word.meaning.id.length).toBeGreaterThan(0);
                expect(hasClip("word", word.id)).toBe(true);
            }
        }
    });

    it("provides bundled audio clips for all 28 letters across names, fathah, kasrah, and dammah", () => {
        for (const letter of HIJAIYAH) {
            expect(hasClip("name", letter.id)).toBe(true);
            expect(hasClip("fathah", letter.id)).toBe(true);
            expect(hasClip("kasrah", letter.id)).toBe(true);
            expect(hasClip("dammah", letter.id)).toBe(true);
        }
    });

    it("generates vowel-aware questions for Level 2 contrasting kasrah and dammah", () => {
        const level2Lesson = LEVEL_2[0];
        const quiz = buildQuiz(level2Lesson, "en", seededRandom(42));
        expect(quiz).toHaveLength(QUIZ_LENGTH);
        const vowels = new Set(quiz.map((q) => q.vowel));
        expect(vowels.has("kasrah")).toBe(true);
        expect(vowels.has("dammah")).toBe(true);
    });

    it("provides connected words and shape recognition quizzes for Level 3", () => {
        const level3Lessons = lessonsForLevel(3);
        expect(level3Lessons.length).toBe(7);
        for (const lesson of level3Lessons) {
            expect(lesson.connectedWords).toBeDefined();
            expect(lesson.connectedWords!.length).toBeGreaterThanOrEqual(4);
            for (const word of lesson.connectedWords!) {
                expect(word.arabic.length).toBeGreaterThan(0);
                expect(word.transliteration.en.length).toBeGreaterThan(0);
                expect(word.transliteration.id.length).toBeGreaterThan(0);
            }
        }

        // Test quiz for Level 3
        const quiz = buildQuiz(level3Lessons[0], "en", seededRandom(10));
        expect(quiz).toHaveLength(QUIZ_LENGTH);
        const kinds = new Set(quiz.map((q) => q.kind));
        expect(kinds.has("connectedForm")).toBe(true);
        expect(kinds.has("whichLetter")).toBe(true);
        for (const q of quiz) {
            expect(q.options.length).toBe(4);
            if (q.kind === "connectedForm") {
                expect(["initial", "medial", "final"]).toContain(q.formPosition);
            }
        }
    });

    it("configures Level 4 lessons for fathatain, kasratain, dammatain, and sukun", () => {
        const level4Lessons = lessonsForLevel(4);
        expect(level4Lessons.length).toBe(4);

        expect(level4Lessons[0].vowelKind).toBe("fathatain");
        expect(level4Lessons[1].vowelKind).toBe("kasratain");
        expect(level4Lessons[2].vowelKind).toBe("dammatain");
        expect(level4Lessons[3].vowelKind).toBe("sukun");

        // Tanwin audio clips for all 28 letters
        for (const letter of HIJAIYAH) {
            expect(hasClip("fathatain", letter.id)).toBe(true);
            expect(hasClip("kasratain", letter.id)).toBe(true);
            expect(hasClip("dammatain", letter.id)).toBe(true);
        }

        // Sukun words and clips
        expect(level4Lessons[3].words).toBeDefined();
        expect(level4Lessons[3].words!.length).toBe(6);
        for (const word of level4Lessons[3].words!) {
            expect(hasClip("sukun", word.id)).toBe(true);
            expect(hasClip("word", word.id)).toBe(true);
            expect(word.meaning.en.length).toBeGreaterThan(0);
            expect(word.meaning.id.length).toBeGreaterThan(0);
        }

        // Tanwin quiz for 4-1
        const tanwinQuiz = buildQuiz(level4Lessons[0], "en", seededRandom(15));
        expect(tanwinQuiz).toHaveLength(QUIZ_LENGTH);
        for (const q of tanwinQuiz) {
            expect(q.vowel).toBe("fathatain");
            expect(q.options.length).toBe(4);
        }

        // Sukun word quiz for 4-4
        const sukunQuiz = buildQuiz(level4Lessons[3], "en", seededRandom(20));
        expect(sukunQuiz.length).toBe(6);
        for (const q of sukunQuiz) {
            expect(["readWord", "findWord"]).toContain(q.kind);
            expect(q.wordAnswer).toBeDefined();
            expect(q.wordOptions).toBeDefined();
            expect(q.wordOptions!.length).toBeGreaterThanOrEqual(2);
        }
    });
});

