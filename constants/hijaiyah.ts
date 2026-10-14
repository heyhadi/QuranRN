// The 28 hijaiyah letters for the Learn to Read lessons, in the usual alphabet order.
//
// Each letter is taught first with fathah: the letter plus U+064E, read as one open syllable ("ba").
// Alif can't carry a vowel on its own, so its fathah syllable is written on hamzah (أَ).
// The Latin sound is spelled the way each audience learns it: Indonesian classes write "tsa", "kho",
// "ro"; English courses write "tha", "kha", "ra". Dotted English letters mark the heavy sounds.
//
// Content still needs a review by a qualified teacher before release (see ROADMAP.md).

export const FATHAH = "َ";

export interface HijaiyahLetter {
    /** Stable id, used for progress, audio file names and React keys. */
    id: string;
    /** The bare letter, as shown on its introduction card. */
    letter: string;
    /** The letter's name, in Arabic script. */
    nameArabic: string;
    /** The letter's name in Latin script, per language. */
    name: { en: string; id: string };
    /** The letter read with fathah. */
    fathah: string;
    /** How the fathah syllable sounds, per language. */
    sound: { en: string; id: string };
}

const letter = (id: string, bare: string, nameArabic: string, name: [en: string, id: string], sound: [en: string, id: string], base = bare): HijaiyahLetter => ({
    id,
    letter: bare,
    nameArabic,
    name: { en: name[0], id: name[1] },
    fathah: base + FATHAH,
    sound: { en: sound[0], id: sound[1] },
});

export const HIJAIYAH: readonly HijaiyahLetter[] = [
    letter("alif", "ا", "أَلِف", ["Alif", "Alif"], ["a", "a"], "أ"),
    letter("ba", "ب", "بَاء", ["Ba", "Ba"], ["ba", "ba"]),
    letter("ta", "ت", "تَاء", ["Ta", "Ta"], ["ta", "ta"]),
    letter("tha", "ث", "ثَاء", ["Tha", "Tsa"], ["tha", "tsa"]),
    letter("jim", "ج", "جِيم", ["Jim", "Jim"], ["ja", "ja"]),
    letter("ha", "ح", "حَاء", ["Ḥa", "Ha"], ["ḥa", "ha"]),
    letter("kha", "خ", "خَاء", ["Kha", "Kho"], ["kha", "kho"]),
    letter("dal", "د", "دَال", ["Dal", "Dal"], ["da", "da"]),
    letter("dhal", "ذ", "ذَال", ["Dhal", "Dzal"], ["dha", "dza"]),
    letter("ra", "ر", "رَاء", ["Ra", "Ro"], ["ra", "ro"]),
    letter("zay", "ز", "زَاي", ["Zay", "Zai"], ["za", "za"]),
    letter("sin", "س", "سِين", ["Sin", "Sin"], ["sa", "sa"]),
    letter("shin", "ش", "شِين", ["Shin", "Syin"], ["sha", "sya"]),
    letter("sad", "ص", "صَاد", ["Ṣad", "Shod"], ["ṣa", "sho"]),
    letter("dad", "ض", "ضَاد", ["Ḍad", "Dhod"], ["ḍa", "dho"]),
    letter("taa", "ط", "طَاء", ["Ṭa", "Tho"], ["ṭa", "tho"]),
    letter("zaa", "ظ", "ظَاء", ["Ẓa", "Zho"], ["ẓa", "zho"]),
    letter("ayn", "ع", "عَيْن", ["ʿAyn", "'Ain"], ["ʿa", "'a"]),
    letter("ghayn", "غ", "غَيْن", ["Ghayn", "Ghoin"], ["gha", "gho"]),
    letter("fa", "ف", "فَاء", ["Fa", "Fa"], ["fa", "fa"]),
    letter("qaf", "ق", "قَاف", ["Qaf", "Qof"], ["qa", "qo"]),
    letter("kaf", "ك", "كَاف", ["Kaf", "Kaf"], ["ka", "ka"]),
    letter("lam", "ل", "لَام", ["Lam", "Lam"], ["la", "la"]),
    letter("mim", "م", "مِيم", ["Mim", "Mim"], ["ma", "ma"]),
    letter("nun", "ن", "نُون", ["Nun", "Nun"], ["na", "na"]),
    letter("waw", "و", "وَاو", ["Waw", "Wau"], ["wa", "wa"]),
    letter("haa", "ه", "هَاء", ["Ha", "Ha'"], ["ha", "ha"]),
    letter("ya", "ي", "يَاء", ["Ya", "Ya"], ["ya", "ya"]),
];

export type LearnLanguage = keyof HijaiyahLetter["sound"];

/** "id" for Indonesian, "en" for anything else. */
export function learnLanguage(language: string): LearnLanguage {
    return language.startsWith("id") ? "id" : "en";
}
