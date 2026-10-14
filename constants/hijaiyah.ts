// The 28 hijaiyah letters for the Learn to Read lessons, in the usual alphabet order.
//
// Each letter is taught first with fathah: the letter plus U+064E, read as one open syllable ("ba").
// Alif can't carry a vowel on its own, so its fathah syllable is written on hamzah (أَ).
// The Latin sound is spelled the way each audience learns it: Indonesian classes write "tsa", "kho",
// "ro"; English courses write "tha", "kha", "ra". Dotted English letters mark the heavy sounds.
//
// Content still needs a review by a qualified teacher before release (see ROADMAP.md).

export const FATHAH = "\u064E";
export const KASRAH = "\u0650";
export const DAMMAH = "\u064F";
export const SUKUN = "\u0652";
export const FATHATAIN = "\u064B";
export const KASRATAIN = "\u064D";
export const DAMMATAIN = "\u064C";

export interface LetterForms {
    isolated: string;
    initial: string;
    medial: string;
    final: string;
}

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
    /** The letter read with kasrah. */
    kasrah: string;
    /** How the kasrah syllable sounds, per language. */
    soundKasrah: { en: string; id: string };
    /** The letter read with dammah. */
    dammah: string;
    /** How the dammah syllable sounds, per language. */
    soundDammah: { en: string; id: string };
    /** The letter read with fathatain (-an). */
    fathatain: string;
    soundAn: { en: string; id: string };
    /** The letter read with kasratain (-in). */
    kasratain: string;
    soundIn: { en: string; id: string };
    /** The letter read with dammatain (-un). */
    dammatain: string;
    soundUn: { en: string; id: string };
    /** Letter shapes in isolated, initial, medial, and final positions. */
    forms: LetterForms;
    /** True if the letter does not connect to the following letter (e.g. Alif, Dal, Ra, Waw). */
    nonConnecting: boolean;
    /** Articulation point (Makhraj) description. */
    makhraj: { en: string; id: string };
}

interface LetterConfig {
    id: string;
    bare: string;
    nameArabic: string;
    name: [en: string, id: string];
    soundA: [en: string, id: string];
    soundI: [en: string, id: string];
    soundU: [en: string, id: string];
    forms: [isolated: string, initial: string, medial: string, final: string];
    nonConnecting?: boolean;
    makhraj: [en: string, id: string];
    baseFathah?: string;
    baseKasrah?: string;
    baseDammah?: string;
}

const letter = (c: LetterConfig): HijaiyahLetter => ({
    id: c.id,
    letter: c.bare,
    nameArabic: c.nameArabic,
    name: { en: c.name[0], id: c.name[1] },
    fathah: (c.baseFathah ?? c.bare) + FATHAH,
    sound: { en: c.soundA[0], id: c.soundA[1] },
    kasrah: (c.baseKasrah ?? c.bare) + KASRAH,
    soundKasrah: { en: c.soundI[0], id: c.soundI[1] },
    dammah: (c.baseDammah ?? c.bare) + DAMMAH,
    soundDammah: { en: c.soundU[0], id: c.soundU[1] },
    fathatain: c.bare === "ا" ? "أ" + FATHATAIN : c.bare + FATHATAIN,
    soundAn: { en: c.soundA[0] + "n", id: c.soundA[1] + "n" },
    kasratain: c.bare === "ا" ? "إ" + KASRATAIN : c.bare + KASRATAIN,
    soundIn: { en: c.soundI[0] + "n", id: c.soundI[1] + "n" },
    dammatain: c.bare === "ا" ? "أ" + DAMMATAIN : c.bare + DAMMATAIN,
    soundUn: { en: c.soundU[0] + "n", id: c.soundU[1] + "n" },
    forms: {
        isolated: c.forms[0],
        initial: c.forms[1],
        medial: c.forms[2],
        final: c.forms[3],
    },
    nonConnecting: c.nonConnecting ?? false,
    makhraj: { en: c.makhraj[0], id: c.makhraj[1] },
});

export const HIJAIYAH: readonly HijaiyahLetter[] = [
    letter({
        id: "alif",
        bare: "ا",
        nameArabic: "أَلِف",
        name: ["Alif", "Alif"],
        soundA: ["a", "a"],
        soundI: ["i", "i"],
        soundU: ["u", "u"],
        baseFathah: "أ",
        baseKasrah: "إ",
        baseDammah: "أ",
        forms: ["ا", "ا", "ـا", "ـا"],
        nonConnecting: true,
        makhraj: ["Empty space of mouth & throat (Jawf)", "Rongga mulut dan tenggorokan (Al-Jauf)"],
    }),
    letter({
        id: "ba",
        bare: "ب",
        nameArabic: "بَاء",
        name: ["Ba", "Ba"],
        soundA: ["ba", "ba"],
        soundI: ["bi", "bi"],
        soundU: ["bu", "bu"],
        forms: ["ب", "بـ", "ـبـ", "ـب"],
        makhraj: ["Between both lips closed (Shafatayn)", "Pertemuan dua bibir (Asy-Syafatain)"],
    }),
    letter({
        id: "ta",
        bare: "ت",
        nameArabic: "تَاء",
        name: ["Ta", "Ta"],
        soundA: ["ta", "ta"],
        soundI: ["ti", "ti"],
        soundU: ["tu", "tu"],
        forms: ["ت", "تـ", "ـتـ", "ـت"],
        makhraj: ["Tip of tongue against upper front teeth roots", "Ujung lidah menempel pangkal gigi seri atas"],
    }),
    letter({
        id: "tha",
        bare: "ث",
        nameArabic: "ثَاء",
        name: ["Tha", "Tsa"],
        soundA: ["tha", "tsa"],
        soundI: ["thi", "tsi"],
        soundU: ["thu", "tsu"],
        forms: ["ث", "ثـ", "ـثـ", "ـث"],
        makhraj: ["Tip of tongue touching edges of upper front teeth", "Ujung lidah bertemu tepi gigi seri atas"],
    }),
    letter({
        id: "jim",
        bare: "ج",
        nameArabic: "جِيم",
        name: ["Jim", "Jim"],
        soundA: ["ja", "ja"],
        soundI: ["ji", "ji"],
        soundU: ["ju", "ju"],
        forms: ["ج", "جـ", "ـجـ", "ـج"],
        makhraj: ["Middle of the tongue against the roof of the mouth", "Tengah lidah bertemu langit-langit mulut"],
    }),
    letter({
        id: "ha",
        bare: "ح",
        nameArabic: "حَاء",
        name: ["Ḥa", "Ha"],
        soundA: ["ḥa", "ha"],
        soundI: ["ḥi", "hi"],
        soundU: ["ḥu", "hu"],
        forms: ["ح", "حـ", "ـحـ", "ـح"],
        makhraj: ["Middle of the throat (clean friction sound)", "Tengah tenggorokan (bersih tanpa hambatan kasar)"],
    }),
    letter({
        id: "kha",
        bare: "خ",
        nameArabic: "خَاء",
        name: ["Kha", "Kho"],
        soundA: ["kha", "kho"],
        soundI: ["khi", "khi"],
        soundU: ["khu", "khu"],
        forms: ["خ", "خـ", "ـخـ", "ـخ"],
        makhraj: ["Upper throat closest to the mouth", "Tenggorokan atas mendekati pangkal mulut"],
    }),
    letter({
        id: "dal",
        bare: "د",
        nameArabic: "دَال",
        name: ["Dal", "Dal"],
        soundA: ["da", "da"],
        soundI: ["di", "di"],
        soundU: ["du", "du"],
        forms: ["د", "د", "ـد", "ـد"],
        nonConnecting: true,
        makhraj: ["Tip of tongue on base of upper front teeth", "Ujung lidah menempel pangkal gigi seri atas"],
    }),
    letter({
        id: "dhal",
        bare: "ذ",
        nameArabic: "ذَال",
        name: ["Dhal", "Dzal"],
        soundA: ["dha", "dza"],
        soundI: ["dhi", "dzi"],
        soundU: ["dhu", "dzu"],
        forms: ["ذ", "ذ", "ـذ", "ـذ"],
        nonConnecting: true,
        makhraj: ["Tip of tongue touching edges of upper teeth", "Ujung lidah menyentuh tepi gigi seri atas"],
    }),
    letter({
        id: "ra",
        bare: "ر",
        nameArabic: "رَاء",
        name: ["Ra", "Ro"],
        soundA: ["ra", "ro"],
        soundI: ["ri", "ri"],
        soundU: ["ru", "ru"],
        forms: ["ر", "ر", "ـر", "ـر"],
        nonConnecting: true,
        makhraj: ["Tip of tongue slightly curved towards upper palate", "Ujung lidah dekat gusi gigi seri atas"],
    }),
    letter({
        id: "zay",
        bare: "ز",
        nameArabic: "زَاي",
        name: ["Zay", "Zai"],
        soundA: ["za", "za"],
        soundI: ["zi", "zi"],
        soundU: ["zu", "zu"],
        forms: ["ز", "ز", "ـز", "ـز"],
        nonConnecting: true,
        makhraj: ["Tip of tongue close to inner surface of lower front teeth", "Ujung lidah di atas gigi seri bawah (desis tajam)"],
    }),
    letter({
        id: "sin",
        bare: "س",
        nameArabic: "سِين",
        name: ["Sin", "Sin"],
        soundA: ["sa", "sa"],
        soundI: ["si", "si"],
        soundU: ["su", "su"],
        forms: ["س", "سـ", "ـسـ", "ـس"],
        makhraj: ["Tip of tongue with lower teeth, soft whistling sound", "Ujung lidah di atas gigi seri bawah (desis halus)"],
    }),
    letter({
        id: "shin",
        bare: "ش",
        nameArabic: "شِين",
        name: ["Shin", "Syin"],
        soundA: ["sha", "sya"],
        soundI: ["shi", "syi"],
        soundU: ["shu", "syu"],
        forms: ["ش", "شـ", "ـشـ", "ـش"],
        makhraj: ["Middle tongue, spreading air sound (Tafashshi)", "Tengah lidah, hembusan angin menyebar (Tafasy-syi)"],
    }),
    letter({
        id: "sad",
        bare: "ص",
        nameArabic: "صَاد",
        name: ["Ṣad", "Shod"],
        soundA: ["ṣa", "sho"],
        soundI: ["ṣi", "shi"],
        soundU: ["ṣu", "shu"],
        forms: ["ص", "صـ", "ـصـ", "ـص"],
        makhraj: ["Tip of tongue, heavy whistling (Ithbaq)", "Ujung lidah dengan tebal terangkat (Ithbaq)"],
    }),
    letter({
        id: "dad",
        bare: "ض",
        nameArabic: "ضَاد",
        name: ["Ḍad", "Dhod"],
        soundA: ["ḍa", "dho"],
        soundI: ["ḍi", "dhi"],
        soundU: ["ḍu", "dhu"],
        forms: ["ض", "ضـ", "ـضـ", "ـض"],
        makhraj: ["Side edge of tongue against upper molars", "Sisi samping lidah bertemu geraham atas"],
    }),
    letter({
        id: "taa",
        bare: "ط",
        nameArabic: "طَاء",
        name: ["Ṭa", "Tho"],
        soundA: ["ṭa", "tho"],
        soundI: ["ṭi", "thi"],
        soundU: ["ṭu", "thu"],
        forms: ["ط", "طـ", "ـطـ", "ـط"],
        makhraj: ["Tongue tip at base of upper teeth with back elevated", "Ujung lidah di pangkal gigi seri atas dengan suara tebal"],
    }),
    letter({
        id: "zaa",
        bare: "ظ",
        nameArabic: "ظَاء",
        name: ["Ẓa", "Zho"],
        soundA: ["ẓa", "zho"],
        soundI: ["ẓi", "zhi"],
        soundU: ["ẓu", "zhu"],
        forms: ["ظ", "ظـ", "ـظـ", "ـظ"],
        makhraj: ["Tongue tip at edge of upper teeth with back elevated", "Ujung lidah di tepi gigi seri atas dengan suara tebal"],
    }),
    letter({
        id: "ayn",
        bare: "ع",
        nameArabic: "عَيْن",
        name: ["ʿAyn", "'Ain"],
        soundA: ["ʿa", "'a"],
        soundI: ["ʿi", "'i"],
        soundU: ["ʿu", "'u"],
        forms: ["ع", "عـ", "ـعـ", "ـع"],
        makhraj: ["Deep in the middle of throat", "Tengah tenggorokan ditekan"],
    }),
    letter({
        id: "ghayn",
        bare: "غ",
        nameArabic: "غَيْن",
        name: ["Ghayn", "Ghoin"],
        soundA: ["gha", "gho"],
        soundI: ["ghi", "ghi"],
        soundU: ["ghu", "ghu"],
        forms: ["غ", "غـ", "ـغـ", "ـغ"],
        makhraj: ["Upper throat, gargling-like sound", "Tenggorokan atas dekat anak tekak"],
    }),
    letter({
        id: "fa",
        bare: "ف",
        nameArabic: "فَاء",
        name: ["Fa", "Fa"],
        soundA: ["fa", "fa"],
        soundI: ["fi", "fi"],
        soundU: ["fu", "fu"],
        forms: ["ف", "فـ", "ـفـ", "ـف"],
        makhraj: ["Edge of upper teeth against inside of lower lip", "Tepi gigi seri atas menyentuh bibir bawah bagian dalam"],
    }),
    letter({
        id: "qaf",
        bare: "ق",
        nameArabic: "قَاف",
        name: ["Qaf", "Qof"],
        soundA: ["qa", "qo"],
        soundI: ["qi", "qi"],
        soundU: ["qu", "qu"],
        forms: ["ق", "قـ", "ـقـ", "ـق"],
        makhraj: ["Deepest back of the tongue near the soft palate", "Pangkal lidah paling belakang bertemu langit-langit lunak"],
    }),
    letter({
        id: "kaf",
        bare: "ك",
        nameArabic: "كَاف",
        name: ["Kaf", "Kaf"],
        soundA: ["ka", "ka"],
        soundI: ["ki", "ki"],
        soundU: ["ku", "ku"],
        forms: ["ك", "كـ", "ـكـ", "ـك"],
        makhraj: ["Back of tongue slightly forward from Qaf (Hams breath)", "Pangkal lidah sedikit di depan Qaf (berhembus angin)"],
    }),
    letter({
        id: "lam",
        bare: "ل",
        nameArabic: "لَام",
        name: ["Lam", "Lam"],
        soundA: ["la", "la"],
        soundI: ["li", "li"],
        soundU: ["lu", "lu"],
        forms: ["ل", "لـ", "ـلـ", "ـل"],
        makhraj: ["Front side of tongue to the gum of front teeth", "Ujung tepi lidah ke gusi gigi depan"],
    }),
    letter({
        id: "mim",
        bare: "م",
        nameArabic: "مِيم",
        name: ["Mim", "Mim"],
        soundA: ["ma", "ma"],
        soundI: ["mi", "mi"],
        soundU: ["mu", "mu"],
        forms: ["م", "مـ", "ـمـ", "ـم"],
        makhraj: ["Both lips closed with nasal resonance (Ghunnah)", "Dua bibir merapat disertai dengung rongga hidung"],
    }),
    letter({
        id: "nun",
        bare: "ن",
        nameArabic: "نُون",
        name: ["Nun", "Nun"],
        soundA: ["na", "na"],
        soundI: ["ni", "ni"],
        soundU: ["nu", "nu"],
        forms: ["ن", "نـ", "ـنـ", "ـن"],
        makhraj: ["Tongue tip on upper gums with nasal resonance", "Ujung lidah menempel gusi atas disertai dengung"],
    }),
    letter({
        id: "waw",
        bare: "و",
        nameArabic: "وَاو",
        name: ["Waw", "Wau"],
        soundA: ["wa", "wa"],
        soundI: ["wi", "wi"],
        soundU: ["wu", "wu"],
        forms: ["و", "و", "ـو", "ـو"],
        nonConnecting: true,
        makhraj: ["Rounding both lips without full closure", "Membulatkan kedua bibir tanpa merapat"],
    }),
    letter({
        id: "haa",
        bare: "ه",
        nameArabic: "هَاء",
        name: ["Ha", "Ha'"],
        soundA: ["ha", "ha"],
        soundI: ["hi", "hi"],
        soundU: ["hu", "hu"],
        forms: ["ه", "هـ", "ـهـ", "ـه"],
        makhraj: ["Deepest part of the throat near chest", "Pangkal tenggorokan paling dalam"],
    }),
    letter({
        id: "ya",
        bare: "ي",
        nameArabic: "يَاء",
        name: ["Ya", "Ya"],
        soundA: ["ya", "ya"],
        soundI: ["yi", "yi"],
        soundU: ["yu", "yu"],
        forms: ["ي", "يـ", "ـيـ", "ـي"],
        makhraj: ["Middle of the tongue against upper palate", "Tengah lidah ke langit-langit mulut"],
    }),
];

export type LearnLanguage = keyof HijaiyahLetter["sound"];

/** "id" for Indonesian, "en" for anything else. */
export function learnLanguage(language: string): LearnLanguage {
    return language.startsWith("id") ? "id" : "en";
}
