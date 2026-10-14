import { HIJAIYAH, type HijaiyahLetter, type LearnLanguage } from "@/constants/hijaiyah";

// Learn to Read, level 1: the 28 letters with fathah, a few at a time.
//
// Each lesson introduces LESSON_SIZE new letters, then reading rows that mix them with the letters
// already learned (the way beginner primers drill), then a short quiz. Everything here is pure and
// takes its randomness as an argument, so lessons can be tested and replayed.

export const LESSON_SIZE = 4;
/** Share of quiz answers needed to finish a lesson. */
export const PASS_RATIO = 0.8;
export const QUIZ_LENGTH = 8;
const OPTIONS_PER_QUESTION = 4;

/**
 * Letters beginners mix up because they share a shape and differ only in dots (or one stroke).
 * Quiz distractors come from here first, since telling these apart is the real skill.
 */
const LOOKALIKES: readonly (readonly string[])[] = [
    ["ba", "ta", "tha", "nun", "ya"],
    ["jim", "ha", "kha"],
    ["dal", "dhal"],
    ["ra", "zay", "waw"],
    ["sin", "shin"],
    ["sad", "dad"],
    ["taa", "zaa"],
    ["ayn", "ghayn"],
    ["fa", "qaf"],
];

export interface Lesson {
    /** 1-based, shown to the user. */
    number: number;
    id: string;
    /** The letters this lesson introduces. */
    letters: HijaiyahLetter[];
    /** Every letter known by the end of this lesson, this one's included. */
    known: HijaiyahLetter[];
}

export const LEVEL_1: readonly Lesson[] = Array.from({ length: Math.ceil(HIJAIYAH.length / LESSON_SIZE) }, (_, index) => {
    const end = Math.min(HIJAIYAH.length, (index + 1) * LESSON_SIZE);
    return {
        number: index + 1,
        id: `1-${index + 1}`,
        letters: HIJAIYAH.slice(index * LESSON_SIZE, end),
        known: HIJAIYAH.slice(0, end),
    };
});

export function lessonById(id: string): Lesson | undefined {
    return LEVEL_1.find((lesson) => lesson.id === id);
}

/** A small seeded random generator (mulberry32), so a lesson's rows and quiz can be reproduced. */
export function seededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

const rowKey = (row: readonly HijaiyahLetter[]) => row.map((letter) => letter.id).join(" ");

/**
 * Reading rows for a lesson, read right to left like the Arabic itself:
 * the new letters in order, then reversed, then mixed with each other, then mixed with earlier letters.
 */
export function readingRows(lesson: Lesson, random: () => number, rowLength = 4): HijaiyahLetter[][] {
    const fresh = lesson.letters;
    const earlier = lesson.known.slice(0, lesson.known.length - fresh.length);
    const rows: HijaiyahLetter[][] = [fresh.slice(0, rowLength), [...fresh].reverse().slice(0, rowLength)];
    const seen = new Set(rows.map(rowKey));
    // Reading the same row twice teaches nothing, so reshuffle a few times to get a new one.
    const addFresh = (make: () => HijaiyahLetter[]) => {
        let row = make();
        for (let attempt = 0; attempt < 10 && seen.has(rowKey(row)); attempt++) row = make();
        seen.add(rowKey(row));
        rows.push(row);
    };

    for (let i = 0; i < 2; i++) addFresh(() => shuffle(fresh, random).slice(0, rowLength));

    if (earlier.length > 0) {
        // Half new, half review, so every row still practises this lesson's letters.
        const half = Math.ceil(rowLength / 2);
        for (let i = 0; i < 2; i++) addFresh(() => shuffle([...shuffle(fresh, random).slice(0, half), ...shuffle(earlier, random).slice(0, rowLength - half)], random));
    }
    return rows;
}

export type QuestionKind =
    /** See the syllable, pick how it sounds. */
    | "readSound"
    /** See (or hear) the sound, pick the syllable. */
    | "findLetter";

export interface QuizQuestion {
    kind: QuestionKind;
    answer: HijaiyahLetter;
    /** Includes the answer, already shuffled. */
    options: HijaiyahLetter[];
}

/** The text a question shows for an option, so two options never look the same. */
function optionKey(kind: QuestionKind, letter: HijaiyahLetter, language: LearnLanguage): string {
    return kind === "readSound" ? letter.sound[language] : letter.fathah;
}

function distractors(answer: HijaiyahLetter, pool: readonly HijaiyahLetter[], kind: QuestionKind, language: LearnLanguage, random: () => number): HijaiyahLetter[] {
    const taken = new Set([optionKey(kind, answer, language)]);
    const picked: HijaiyahLetter[] = [];
    const take = (candidates: readonly HijaiyahLetter[]) => {
        for (const candidate of candidates) {
            if (picked.length >= OPTIONS_PER_QUESTION - 1) return;
            const key = optionKey(kind, candidate, language);
            if (taken.has(key)) continue;
            taken.add(key);
            picked.push(candidate);
        }
    };

    // Look-alikes the learner has already met come first, then anything else they know.
    const lookalikeIds = new Set(LOOKALIKES.filter((group) => group.includes(answer.id)).flat());
    take(shuffle(pool.filter((letter) => lookalikeIds.has(letter.id)), random));
    take(shuffle(pool, random));
    // Early lessons know only a few letters; fill up from the whole alphabet so there are always enough.
    take(shuffle(HIJAIYAH, random));
    return picked;
}

/**
 * Reorders the answers so the same letter is never asked twice in a row. Each step takes the letter
 * with the most questions left that differs from the last one (earliest first on a tie, so the
 * shuffle still decides), which always works while no letter fills more than half the quiz.
 */
function spreadRepeats(answers: HijaiyahLetter[]): HijaiyahLetter[] {
    const remaining = [...answers];
    const result: HijaiyahLetter[] = [];
    while (remaining.length > 0) {
        const last = result[result.length - 1];
        const left = (id: string) => remaining.filter((letter) => letter.id === id).length;
        let pick = -1;
        remaining.forEach((letter, index) => {
            if (letter.id === last?.id) return;
            if (pick === -1 || left(letter.id) > left(remaining[pick].id)) pick = index;
        });
        result.push(remaining.splice(pick === -1 ? 0 : pick, 1)[0]);
    }
    return result;
}

/** No letter is asked more often than this in one quiz. */
const MAX_ASKS_PER_LETTER = 2;

/**
 * A quiz on a lesson: every new letter is asked at least once, the rest of the questions review
 * earlier letters, and the two question kinds alternate.
 */
export function buildQuiz(lesson: Lesson, language: LearnLanguage, random: () => number, length = QUIZ_LENGTH): QuizQuestion[] {
    const earlier = lesson.known.slice(0, lesson.known.length - lesson.letters.length);
    const answers = [...shuffle(lesson.letters, random)];
    const asked = (letter: HijaiyahLetter) => answers.filter((answer) => answer.id === letter.id).length;
    while (answers.length < length) {
        const source = earlier.length > 0 && random() < 0.5 ? earlier : lesson.letters;
        const open = source.filter((letter) => asked(letter) < MAX_ASKS_PER_LETTER);
        const pool = open.length > 0 ? open : lesson.known.filter((letter) => asked(letter) < MAX_ASKS_PER_LETTER);
        if (pool.length === 0) break;
        answers.push(pool[Math.floor(random() * pool.length)]);
    }

    return spreadRepeats(shuffle(answers.slice(0, length), random)).map((answer, index) => {
        const kind: QuestionKind = index % 2 === 0 ? "readSound" : "findLetter";
        return { kind, answer, options: shuffle([answer, ...distractors(answer, lesson.known, kind, language, random)], random) };
    });
}

export function hasPassed(correct: number, total: number): boolean {
    return total > 0 && correct / total >= PASS_RATIO;
}
