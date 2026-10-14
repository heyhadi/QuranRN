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

export interface QuranWord {
    id: string;
    arabic: string;
    transliteration: { en: string; id: string };
    meaning: { en: string; id: string };
    audioUrl: string;
}

export interface ConnectedWord {
    id: string;
    arabic: string;
    transliteration: { en: string; id: string };
    meaning?: { en: string; id: string };
}

export type LessonLevel = 1 | 2 | 3 | 4 | 5;

export type VowelKind = "fathah" | "kasrah" | "dammah" | "fathatain" | "kasratain" | "dammatain" | "sukun";

export interface Lesson {
    /** 1-based, shown to the user within the level. */
    number: number;
    level: LessonLevel;
    id: string;
    /** The letters this lesson introduces. */
    letters: readonly HijaiyahLetter[];
    /** Every letter known by the end of this lesson, this one's included. */
    known: readonly HijaiyahLetter[];
    /** Curated Quran words for word-level lessons (Level 5 and 4-4). */
    words?: QuranWord[];
    /** Connected words for connected letter practice (Level 3). */
    connectedWords?: ConnectedWord[];
    /** Specific vowel / mark kind for the lesson (Level 4 tanwin/sukun). */
    vowelKind?: VowelKind;
}

export const LEVEL_1: readonly Lesson[] = Array.from({ length: Math.ceil(HIJAIYAH.length / LESSON_SIZE) }, (_, index) => {
    const end = Math.min(HIJAIYAH.length, (index + 1) * LESSON_SIZE);
    return {
        number: index + 1,
        level: 1,
        id: `1-${index + 1}`,
        letters: HIJAIYAH.slice(index * LESSON_SIZE, end),
        known: HIJAIYAH.slice(0, end),
    };
});

/** Level 2: Kasrah (-i) and Dammah (-u) vowel contrasts. */
export const LEVEL_2: readonly Lesson[] = Array.from({ length: Math.ceil(HIJAIYAH.length / LESSON_SIZE) }, (_, index) => {
    const end = Math.min(HIJAIYAH.length, (index + 1) * LESSON_SIZE);
    return {
        number: index + 1,
        level: 2,
        id: `2-${index + 1}`,
        letters: HIJAIYAH.slice(index * LESSON_SIZE, end),
        known: HIJAIYAH.slice(0, end),
    };
});

const LEVEL_3_WORDS: readonly ConnectedWord[][] = [
    // 3-1: Alif, Ba, Ta, Tha
    [
        { id: "c_3_1_1", arabic: "بَتَ", transliteration: { en: "ba - ta", id: "ba - ta" } },
        { id: "c_3_1_2", arabic: "تَبَ", transliteration: { en: "ta - ba", id: "ta - ba" } },
        { id: "c_3_1_3", arabic: "ثَبَتَ", transliteration: { en: "tha - ba - ta", id: "tsa - ba - ta" }, meaning: { en: "He remained firm", id: "Tetap / Kokoh" } },
        { id: "c_3_1_4", arabic: "أَبَتَ", transliteration: { en: "a - ba - ta", id: "a - ba - ta" } },
        { id: "c_3_1_5", arabic: "أَثَبَ", transliteration: { en: "a - tha - ba", id: "a - tsa - ba" } },
        { id: "c_3_1_6", arabic: "بَتَتَ", transliteration: { en: "ba - ta - ta", id: "ba - ta - ta" } },
    ],
    // 3-2: Jim, Ha, Kha, Dal
    [
        { id: "c_3_2_1", arabic: "حَجَبَ", transliteration: { en: "ha - ja - ba", id: "ha - ja - ba" }, meaning: { en: "He veiled / blocked", id: "Menghalangi" } },
        { id: "c_3_2_2", arabic: "بَحَثَ", transliteration: { en: "ba - ha - tha", id: "ba - ha - tsa" }, meaning: { en: "He searched", id: "Membahas / Mencari" } },
        { id: "c_3_2_3", arabic: "حَدَثَ", transliteration: { en: "ha - da - tha", id: "ha - da - tsa" }, meaning: { en: "It happened", id: "Terjadi" } },
        { id: "c_3_2_4", arabic: "جَدَدَ", transliteration: { en: "ja - da - da", id: "ja - da - da" }, meaning: { en: "He renewed", id: "Memperbarui" } },
        { id: "c_3_2_5", arabic: "خَبَثَ", transliteration: { en: "kha - ba - tha", id: "kho - ba - tsa" }, meaning: { en: "Became bad", id: "Kotor / Buruk" } },
        { id: "c_3_2_6", arabic: "دَأَبَ", transliteration: { en: "da - a - ba", id: "da - a - ba" }, meaning: { en: "He persisted", id: "Terus menerus" } },
    ],
    // 3-3: Dhal, Ra, Zay, Sin
    [
        { id: "c_3_3_1", arabic: "دَرَسَ", transliteration: { en: "da - ra - sa", id: "da - ro - sa" }, meaning: { en: "He studied", id: "Belajar" } },
        { id: "c_3_3_2", arabic: "بَرَزَ", transliteration: { en: "ba - ra - za", id: "ba - ro - za" }, meaning: { en: "He emerged", id: "Tampak / Muncul" } },
        { id: "c_3_3_3", arabic: "حَسَدَ", transliteration: { en: "ha - sa - da", id: "ha - sa - da" }, meaning: { en: "He envied", id: "Dengki" } },
        { id: "c_3_3_4", arabic: "سَتَرَ", transliteration: { en: "sa - ta - ra", id: "sa - ta - ro" }, meaning: { en: "He concealed", id: "Menutupi" } },
        { id: "c_3_3_5", arabic: "ذَرَأَ", transliteration: { en: "dha - ra - a", id: "dza - ro - a" }, meaning: { en: "He created", id: "Menciptakan" } },
        { id: "c_3_3_6", arabic: "جَزَرَ", transliteration: { en: "ja - za - ra", id: "ja - za - ro" }, meaning: { en: "He cut / ebbing", id: "Menyembelih / Surut" } },
    ],
    // 3-4: Shin, Sad, Dad, Taa
    [
        { id: "c_3_4_1", arabic: "صَدَرَ", transliteration: { en: "sa - da - ra", id: "sho - da - ro" }, meaning: { en: "He proceeded", id: "Berangkat" } },
        { id: "c_3_4_2", arabic: "ضَرَبَ", transliteration: { en: "da - ra - ba", id: "dho - ro - ba" }, meaning: { en: "He struck", id: "Memukul" } },
        { id: "c_3_4_3", arabic: "طَرَدَ", transliteration: { en: "ta - ra - da", id: "tho - ro - da" }, meaning: { en: "He expelled", id: "Mengusir" } },
        { id: "c_3_4_4", arabic: "حَصَدَ", transliteration: { en: "ha - sa - da", id: "ha - sho - da" }, meaning: { en: "He harvested", id: "Menuai" } },
        { id: "c_3_4_5", arabic: "رَشَدَ", transliteration: { en: "ra - sha - da", id: "ro - sya - da" }, meaning: { en: "He was guided", id: "Mendapat petunjuk" } },
        { id: "c_3_4_6", arabic: "شَطَطَ", transliteration: { en: "sha - ta - ta", id: "sya - tho - tho" }, meaning: { en: "Extravagance", id: "Melampaui batas" } },
    ],
    // 3-5: Zaa, Ayn, Ghayn, Fa
    [
        { id: "c_3_5_1", arabic: "ظَفَرَ", transliteration: { en: "za - fa - ra", id: "zho - fa - ro" }, meaning: { en: "He triumphed", id: "Menang" } },
        { id: "c_3_5_2", arabic: "عَرَفَ", transliteration: { en: "'a - ra - fa", id: "'a - ro - fa" }, meaning: { en: "He recognized", id: "Mengenal" } },
        { id: "c_3_5_3", arabic: "غَفَرَ", transliteration: { en: "gha - fa - ra", id: "gho - fa - ro" }, meaning: { en: "He forgave", id: "Mengampuni" } },
        { id: "c_3_5_4", arabic: "فَتَحَ", transliteration: { en: "fa - ta - ha", id: "fa - ta - ha" }, meaning: { en: "He opened", id: "Membuka" } },
        { id: "c_3_5_5", arabic: "عَبَدَ", transliteration: { en: "'a - ba - da", id: "'a - ba - da" }, meaning: { en: "He worshipped", id: "Menyembah" } },
        { id: "c_3_5_6", arabic: "عَثَرَ", transliteration: { en: "'a - tha - ra", id: "'a - tsa - ro" }, meaning: { en: "He stumbled upon", id: "Menemukan" } },
    ],
    // 3-6: Qaf, Kaf, Lam, Mim
    [
        { id: "c_3_6_1", arabic: "قَرَأَ", transliteration: { en: "qa - ra - a", id: "qo - ro - a" }, meaning: { en: "He read", id: "Membaca" } },
        { id: "c_3_6_2", arabic: "كَتَبَ", transliteration: { en: "ka - ta - ba", id: "ka - ta - ba" }, meaning: { en: "He wrote", id: "Menulis" } },
        { id: "c_3_6_3", arabic: "لَمَسَ", transliteration: { en: "la - ma - sa", id: "la - ma - sa" }, meaning: { en: "He touched", id: "Menyentuh" } },
        { id: "c_3_6_4", arabic: "مَلَكَ", transliteration: { en: "ma - la - ka", id: "ma - la - ka" }, meaning: { en: "He owned", id: "Memiliki" } },
        { id: "c_3_6_5", arabic: "قَبَلَ", transliteration: { en: "qa - ba - la", id: "qo - ba - la" }, meaning: { en: "He accepted", id: "Menerima" } },
        { id: "c_3_6_6", arabic: "كَسَبَ", transliteration: { en: "ka - sa - ba", id: "ka - sa - ba" }, meaning: { en: "He earned", id: "Berusaha / Memperoleh" } },
    ],
    // 3-7: Nun, Haa, Waw, Ya
    [
        { id: "c_3_7_1", arabic: "نَظَرَ", transliteration: { en: "na - za - ra", id: "na - zho - ro" }, meaning: { en: "He looked", id: "Memandang" } },
        { id: "c_3_7_2", arabic: "هَدَمَ", transliteration: { en: "ha - da - ma", id: "ha - da - ma" }, meaning: { en: "He demolished", id: "Meruntuhkan" } },
        { id: "c_3_7_3", arabic: "وَهَبَ", transliteration: { en: "wa - ha - ba", id: "wa - ha - ba" }, meaning: { en: "He granted", id: "Menganugerahkan" } },
        { id: "c_3_7_4", arabic: "يَسَرَ", transliteration: { en: "ya - sa - ra", id: "ya - sa - ro" }, meaning: { en: "He eased", id: "Memudahkan" } },
        { id: "c_3_7_5", arabic: "نَهَرَ", transliteration: { en: "na - ha - ra", id: "na - ha - ro" }, meaning: { en: "He flowed / scolded", id: "Mengalir / Membentak" } },
        { id: "c_3_7_6", arabic: "وَجَدَ", transliteration: { en: "wa - ja - da", id: "wa - ja - da" }, meaning: { en: "He found", id: "Menemukan" } },
    ],
];

/** Level 3: Connected letter shapes (Isolated, Initial, Medial, Final). */
export const LEVEL_3: readonly Lesson[] = Array.from({ length: Math.ceil(HIJAIYAH.length / LESSON_SIZE) }, (_, index) => {
    const end = Math.min(HIJAIYAH.length, (index + 1) * LESSON_SIZE);
    return {
        number: index + 1,
        level: 3,
        id: `3-${index + 1}`,
        letters: HIJAIYAH.slice(index * LESSON_SIZE, end),
        known: HIJAIYAH.slice(0, end),
        connectedWords: LEVEL_3_WORDS[index] ?? [],
    };
});

export const SUKUN_WORDS: QuranWord[] = [
    {
        id: "sukun_qul",
        arabic: "قُلْ",
        transliteration: { en: "qul", id: "qul" },
        meaning: { en: "Say", id: "Katakanlah" },
        audioUrl: "sukun_qul",
    },
    {
        id: "sukun_min",
        arabic: "مِنْ",
        transliteration: { en: "min", id: "min" },
        meaning: { en: "From", id: "Dari" },
        audioUrl: "sukun_min",
    },
    {
        id: "sukun_lam",
        arabic: "لَمْ",
        transliteration: { en: "lam", id: "lam" },
        meaning: { en: "Did not", id: "Tidak / Belum" },
        audioUrl: "sukun_lam",
    },
    {
        id: "sukun_qad",
        arabic: "قَدْ",
        transliteration: { en: "qad", id: "qod" },
        meaning: { en: "Certainly / Already", id: "Sungguh" },
        audioUrl: "sukun_qad",
    },
    {
        id: "sukun_an",
        arabic: "عَنْ",
        transliteration: { en: "'an", id: "'an" },
        meaning: { en: "From / About", id: "Dari / Tentang" },
        audioUrl: "sukun_an",
    },
    {
        id: "sukun_hal",
        arabic: "هَلْ",
        transliteration: { en: "hal", id: "hal" },
        meaning: { en: "Is / Has?", id: "Apakah" },
        audioUrl: "sukun_hal",
    },
];

/** Level 4: Tanwin (an, in, un) and Sukun (consonant stops). */
export const LEVEL_4: readonly Lesson[] = [
    {
        number: 1,
        level: 4,
        id: "4-1",
        vowelKind: "fathatain",
        letters: HIJAIYAH,
        known: HIJAIYAH,
    },
    {
        number: 2,
        level: 4,
        id: "4-2",
        vowelKind: "kasratain",
        letters: HIJAIYAH,
        known: HIJAIYAH,
    },
    {
        number: 3,
        level: 4,
        id: "4-3",
        vowelKind: "dammatain",
        letters: HIJAIYAH,
        known: HIJAIYAH,
    },
    {
        number: 4,
        level: 4,
        id: "4-4",
        vowelKind: "sukun",
        letters: HIJAIYAH.slice(0, 6),
        known: HIJAIYAH,
        words: SUKUN_WORDS,
    },
];

/** Level 5: Reading Real Quran Words with audio from Quran.com CDN. */
export const LEVEL_5: readonly Lesson[] = [
    {
        number: 1,
        level: 5,
        id: "5-1",
        letters: HIJAIYAH.slice(0, 4),
        known: HIJAIYAH,
        words: [
            {
                id: "w_khalaqa",
                arabic: "خَلَقَ",
                transliteration: { en: "khalaqa", id: "kholaqo" },
                meaning: { en: "He created", id: "Dia menciptakan" },
                audioUrl: "https://audio.qurancdn.com/wbw/113_002_004.mp3",
            },
            {
                id: "w_kasaba",
                arabic: "كَسَبَ",
                transliteration: { en: "kasaba", id: "kasaba" },
                meaning: { en: "He earned", id: "Dia memperoleh / berusaha" },
                audioUrl: "https://audio.qurancdn.com/wbw/111_002_006.mp3",
            },
            {
                id: "w_waqaba",
                arabic: "وَقَبَ",
                transliteration: { en: "waqaba", id: "waqoba" },
                meaning: { en: "It spread / settled", id: "Telah gelap gulita" },
                audioUrl: "https://audio.qurancdn.com/wbw/113_003_005.mp3",
            },
            {
                id: "w_hasada",
                arabic: "حَسَدَ",
                transliteration: { en: "hasada", id: "hasada" },
                meaning: { en: "He envied", id: "Dia dengki" },
                audioUrl: "https://audio.qurancdn.com/wbw/113_005_005.mp3",
            },
        ],
    },
    {
        number: 2,
        level: 5,
        id: "5-2",
        letters: HIJAIYAH.slice(4, 8),
        known: HIJAIYAH,
        words: [
            {
                id: "w_samia",
                arabic: "سَمِعَ",
                transliteration: { en: "sami'a", id: "sami'a" },
                meaning: { en: "He heard", id: "Dia mendengar" },
                audioUrl: "https://audio.qurancdn.com/wbw/058_001_002.mp3",
            },
            {
                id: "w_alima",
                arabic: "عَلِمَ",
                transliteration: { en: "'alima", id: "'alima" },
                meaning: { en: "He knew", id: "Dia mengetahui" },
                audioUrl: "https://audio.qurancdn.com/wbw/008_023_002.mp3",
            },
            {
                id: "w_shahida",
                arabic: "شَهِدَ",
                transliteration: { en: "shahida", id: "syahida" },
                meaning: { en: "He witnessed", id: "Dia menyaksikan" },
                audioUrl: "https://audio.qurancdn.com/wbw/003_018_001.mp3",
            },
            {
                id: "w_rahima",
                arabic: "رَحِمَ",
                transliteration: { en: "rahima", id: "rohima" },
                meaning: { en: "He had mercy", id: "Dia mengasihi / merahmati" },
                audioUrl: "https://audio.qurancdn.com/wbw/044_042_003.mp3",
            },
        ],
    },
    {
        number: 3,
        level: 5,
        id: "5-3",
        letters: HIJAIYAH.slice(8, 12),
        known: HIJAIYAH,
        words: [
            {
                id: "w_ahadun",
                arabic: "أَحَدٌ",
                transliteration: { en: "ahadun", id: "ahadun" },
                meaning: { en: "One (Unique)", id: "Maha Esa" },
                audioUrl: "https://audio.qurancdn.com/wbw/112_001_004.mp3",
            },
            {
                id: "w_samadu",
                arabic: "ٱلصَّمَدُ",
                transliteration: { en: "as-samadu", id: "ash-shomadu" },
                meaning: { en: "The Eternal Refuge", id: "Tempat bergantung segala sesuatu" },
                audioUrl: "https://audio.qurancdn.com/wbw/112_002_002.mp3",
            },
            {
                id: "w_kufuwan",
                arabic: "كُفُوًا",
                transliteration: { en: "kufuwan", id: "kufuwan" },
                meaning: { en: "Equivalent / Equal", id: "Setara" },
                audioUrl: "https://audio.qurancdn.com/wbw/112_004_004.mp3",
            },
            {
                id: "w_maradun",
                arabic: "مَّرَضٌ",
                transliteration: { en: "maradun", id: "marodhun" },
                meaning: { en: "A disease / sickness", id: "Penyakit" },
                audioUrl: "https://audio.qurancdn.com/wbw/002_010_003.mp3",
            },
        ],
    },
    {
        number: 4,
        level: 5,
        id: "5-4",
        letters: HIJAIYAH.slice(12, 16),
        known: HIJAIYAH,
        words: [
            {
                id: "w_alhamdu",
                arabic: "ٱلْحَمْدُ",
                transliteration: { en: "al-hamdu", id: "al-hamdu" },
                meaning: { en: "All praise", id: "Segala puji" },
                audioUrl: "https://audio.qurancdn.com/wbw/001_002_001.mp3",
            },
            {
                id: "w_rabbi",
                arabic: "رَبِّ",
                transliteration: { en: "rabbi", id: "robbi" },
                meaning: { en: "Lord of", id: "Tuhan" },
                audioUrl: "https://audio.qurancdn.com/wbw/001_002_003.mp3",
            },
            {
                id: "w_maliki",
                arabic: "مَـٰلِكِ",
                transliteration: { en: "maliki", id: "maaliki" },
                meaning: { en: "Owner / King of", id: "Pemilik / Raja" },
                audioUrl: "https://audio.qurancdn.com/wbw/001_004_001.mp3",
            },
            {
                id: "w_nabudu",
                arabic: "نَعْبُدُ",
                transliteration: { en: "na'budu", id: "na'budu" },
                meaning: { en: "We worship", id: "Kami menyembah" },
                audioUrl: "https://audio.qurancdn.com/wbw/001_005_002.mp3",
            },
        ],
    },
];

export const ALL_LESSONS: readonly Lesson[] = [
    ...LEVEL_1,
    ...LEVEL_2,
    ...LEVEL_3,
    ...LEVEL_4,
    ...LEVEL_5,
];

export function lessonsForLevel(level: LessonLevel): readonly Lesson[] {
    switch (level) {
        case 1:
            return LEVEL_1;
        case 2:
            return LEVEL_2;
        case 3:
            return LEVEL_3;
        case 4:
            return LEVEL_4;
        case 5:
            return LEVEL_5;
        default:
            return LEVEL_1;
    }
}

export function lessonById(id: string): Lesson | undefined {
    return ALL_LESSONS.find((lesson) => lesson.id === id);
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
    if (lesson.level === 4) {
        const shuffled = shuffle(fresh, random);
        const rows: HijaiyahLetter[][] = [];
        for (let i = 0; i < 4; i++) {
            rows.push(shuffled.slice(i * rowLength, (i + 1) * rowLength));
        }
        return rows;
    }
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
    | "findLetter"
    /** See base letter, pick connected form (initial, medial, or final). */
    | "connectedForm"
    /** See connected form, identify which base letter it belongs to. */
    | "whichLetter"
    /** See Arabic word, pick transliteration. */
    | "readWord"
    /** See transliteration/sound, pick Arabic word. */
    | "findWord";

export interface QuizQuestion {
    kind: QuestionKind;
    answer: HijaiyahLetter;
    /** Includes the answer, already shuffled. */
    options: HijaiyahLetter[];
    vowel?: VowelKind;
    formPosition?: "initial" | "medial" | "final";
    wordAnswer?: QuranWord;
    wordOptions?: QuranWord[];
}

/** The text a question shows for an option, so two options never look the same. */
function optionKey(
    kind: QuestionKind,
    letter: HijaiyahLetter,
    language: LearnLanguage,
    vowel: VowelKind = "fathah",
    formPosition: "initial" | "medial" | "final" = "initial"
): string {
    if (kind === "connectedForm") {
        return letter.forms[formPosition];
    }
    if (kind === "whichLetter") {
        return letter.letter;
    }
    if (kind === "readSound") {
        switch (vowel) {
            case "kasrah":
                return letter.soundKasrah[language];
            case "dammah":
                return letter.soundDammah[language];
            case "fathatain":
                return letter.soundAn[language];
            case "kasratain":
                return letter.soundIn[language];
            case "dammatain":
                return letter.soundUn[language];
            default:
                return letter.sound[language];
        }
    }
    switch (vowel) {
        case "kasrah":
            return letter.kasrah;
        case "dammah":
            return letter.dammah;
        case "fathatain":
            return letter.fathatain;
        case "kasratain":
            return letter.kasratain;
        case "dammatain":
            return letter.dammatain;
        default:
            return letter.fathah;
    }
}

function distractors(
    answer: HijaiyahLetter,
    pool: readonly HijaiyahLetter[],
    kind: QuestionKind,
    language: LearnLanguage,
    random: () => number,
    vowel: VowelKind = "fathah",
    formPosition: "initial" | "medial" | "final" = "initial"
): HijaiyahLetter[] {
    const taken = new Set([optionKey(kind, answer, language, vowel, formPosition)]);
    const picked: HijaiyahLetter[] = [];
    const take = (candidates: readonly HijaiyahLetter[]) => {
        for (const candidate of candidates) {
            if (picked.length >= OPTIONS_PER_QUESTION - 1) return;
            const key = optionKey(kind, candidate, language, vowel, formPosition);
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
    // If it's a word-focused lesson (Level 4-4 sukun or Level 5 Quran words)
    if (lesson.words && lesson.words.length > 0) {
        const words = lesson.words;
        const shuffledWords = shuffle(words, random);
        const questions: QuizQuestion[] = [];
        const dummyLetter = lesson.letters[0] || HIJAIYAH[0];
        const questionCount = Math.min(length, shuffledWords.length);
        for (let i = 0; i < questionCount; i++) {
            const wordAnswer = shuffledWords[i];
            const kind: QuestionKind = i % 2 === 0 ? "readWord" : "findWord";
            const otherWords = shuffle(words.filter((w) => w.id !== wordAnswer.id), random).slice(0, OPTIONS_PER_QUESTION - 1);
            const wordOptions = shuffle([wordAnswer, ...otherWords], random);
            questions.push({
                kind,
                answer: dummyLetter,
                options: [dummyLetter],
                wordAnswer,
                wordOptions,
                vowel: lesson.vowelKind ?? "fathah",
            });
        }
        return questions;
    }

    // Level 3: Connected letter shapes recognition
    if (lesson.level === 3) {
        const positions: readonly ("initial" | "medial" | "final")[] = ["initial", "medial", "final"];
        const answers = [...shuffle(lesson.letters, random)];
        while (answers.length < length) {
            const nextLetter = lesson.letters[Math.floor(random() * lesson.letters.length)];
            answers.push(nextLetter);
        }
        return spreadRepeats(shuffle(answers.slice(0, length), random)).map((answer, index) => {
            const kind: QuestionKind = index % 2 === 0 ? "connectedForm" : "whichLetter";
            const formPosition = positions[index % positions.length];
            return {
                kind,
                answer,
                formPosition,
                options: shuffle([answer, ...distractors(answer, lesson.known, kind, language, random, "fathah", formPosition)], random),
            };
        });
    }

    // Level 4 (4-1 fathatain, 4-2 kasratain, 4-3 dammatain)
    const vowel: VowelKind = lesson.vowelKind ?? (lesson.level === 2 ? "kasrah" : "fathah");

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
        const currentVowel: VowelKind = lesson.level === 2 ? (index % 2 === 0 ? "kasrah" : "dammah") : vowel;
        return {
            kind,
            answer,
            vowel: currentVowel,
            options: shuffle([answer, ...distractors(answer, lesson.known, kind, language, random, currentVowel)], random),
        };
    });
}

export function hasPassed(correct: number, total: number): boolean {
    return total > 0 && correct / total >= PASS_RATIO;
}
