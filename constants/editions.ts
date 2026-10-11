// Translation and tafsir editions the reader can show. Ids are quran.com resource ids, except the
// Indonesian ones, which come from equran.id (Kemenag RI).

export type AppLanguageCode = "id" | "en";

export interface TranslationEdition {
    /** quran.com translation id. */
    id: number;
    name: string;
    language: "en";
}

export const englishTranslations: TranslationEdition[] = [
    { id: 20, name: "Saheeh International", language: "en" },
    { id: 85, name: "M.A.S. Abdel Haleem", language: "en" },
    { id: 22, name: "A. Yusuf Ali", language: "en" },
    { id: 19, name: "M. Pickthall", language: "en" },
    { id: 84, name: "T. Usmani", language: "en" },
    { id: 203, name: "Al-Hilali & Khan", language: "en" },
];

export const DEFAULT_ENGLISH_TRANSLATION_ID = 20;

/** "kemenag" is equran.id's Indonesian tafsir; numbers are quran.com tafsir ids. */
export type TafsirId = "kemenag" | number;

export interface TafsirEdition {
    id: TafsirId;
    name: string;
    language: "id" | "en" | "ar";
}

export const tafsirEditions: TafsirEdition[] = [
    { id: "kemenag", name: "Tafsir Kemenag RI", language: "id" },
    { id: 169, name: "Ibn Kathir (abridged)", language: "en" },
    { id: 168, name: "Ma'arif al-Qur'an", language: "en" },
    { id: 817, name: "Tazkirul Quran", language: "en" },
    { id: 16, name: "Tafsir Al-Muyassar", language: "ar" },
    { id: 91, name: "Tafsir As-Sa'di", language: "ar" },
    { id: 15, name: "Tafsir At-Tabari", language: "ar" },
    { id: 90, name: "Tafsir Al-Qurtubi", language: "ar" },
];

export function defaultTafsirFor(language: AppLanguageCode): TafsirId {
    return language === "id" ? "kemenag" : 169;
}

export function getTafsirEdition(id: TafsirId): TafsirEdition {
    return tafsirEditions.find((edition) => edition.id === id) ?? tafsirEditions[0];
}
