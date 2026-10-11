import { useQuery } from "@tanstack/react-query";
import type { TafsirId } from "@/constants/editions";
import { getAsmaulHusna, getDuas } from "./duas";
import { getFootnote, getQuranComTafsir, getTajweed, getTajweedVerse, getTranslation, getWords, searchAyahs } from "./quranCom";
import { getEnglishSurahMeanings, getSurahDetail, getSurahList, getTafsir } from "./quranService";

// Quran text, translation and tafsir don't change, so cached data never goes stale.
// The cache is saved to disk (see store/storage.ts), which is what makes reading work offline.

export const queryKeys = {
    surahList: ["surahList"] as const,
    surah: (surahNumber: number) => ["surah", surahNumber] as const,
    tafsir: (surahNumber: number) => ["tafsir", surahNumber] as const,
    englishMeanings: ["surahMeanings", "en"] as const,
};

/** Only fetched when the app is in English. */
export function useEnglishSurahMeanings(enabled: boolean) {
    return useQuery({ queryKey: queryKeys.englishMeanings, queryFn: getEnglishSurahMeanings, staleTime: Infinity, enabled });
}

export function useSurahList() {
    return useQuery({ queryKey: queryKeys.surahList, queryFn: getSurahList, staleTime: Infinity });
}

export function useSurahDetail(surahNumber: number) {
    return useQuery({
        queryKey: queryKeys.surah(surahNumber),
        queryFn: () => getSurahDetail(surahNumber),
        staleTime: Infinity,
        enabled: Number.isInteger(surahNumber) && surahNumber >= 1 && surahNumber <= 114,
    });
}

export function useTafsir(surahNumber: number) {
    return useQuery({
        queryKey: queryKeys.tafsir(surahNumber),
        queryFn: () => getTafsir(surahNumber),
        staleTime: Infinity,
        enabled: Number.isInteger(surahNumber) && surahNumber >= 1 && surahNumber <= 114,
    });
}

const validSurah = (surahNumber: number) => Number.isInteger(surahNumber) && surahNumber >= 1 && surahNumber <= 114;

/** Tajweed-coloured text for a Surah; the reader shows plain text until (or unless) it loads. */
export function useTajweed(surahNumber: number, enabled: boolean) {
    return useQuery({ queryKey: ["tajweed", surahNumber], queryFn: () => getTajweed(surahNumber), staleTime: Infinity, enabled: enabled && validSurah(surahNumber) });
}

/** An English translation edition for a Surah (HTML with footnote markers). */
export function useEnglishTranslation(surahNumber: number, editionId: number, enabled: boolean) {
    return useQuery({
        queryKey: ["translation", editionId, surahNumber],
        queryFn: () => getTranslation(surahNumber, editionId),
        staleTime: Infinity,
        enabled: enabled && validSurah(surahNumber),
    });
}

/** Word-by-word meanings for one ayah, fetched when its sheet opens. */
export function useWords(surahNumber: number, ayahNumber: number | null, language: "en" | "id") {
    return useQuery({
        queryKey: ["words", language, surahNumber, ayahNumber],
        queryFn: () => getWords(surahNumber, ayahNumber!, language),
        staleTime: Infinity,
        enabled: ayahNumber !== null && validSurah(surahNumber),
    });
}

/** A quran.com tafsir for one ayah (the Indonesian Kemenag tafsir uses useTafsir instead). */
export function useQuranComTafsir(tafsirId: TafsirId, surahNumber: number, ayahNumber: number | null) {
    return useQuery({
        queryKey: ["tafsirQuranCom", tafsirId, surahNumber, ayahNumber],
        queryFn: () => getQuranComTafsir(tafsirId as number, surahNumber, ayahNumber!),
        staleTime: Infinity,
        enabled: tafsirId !== "kemenag" && ayahNumber !== null && validSurah(surahNumber),
    });
}

export function useFootnote(footnoteId: number | null) {
    return useQuery({ queryKey: ["footnote", footnoteId], queryFn: () => getFootnote(footnoteId!), staleTime: Infinity, enabled: footnoteId !== null });
}

/** Search all ayahs by meaning. Needs a connection; results are not saved. */
export function useAyahSearch(query: string, language: "en" | "id") {
    const trimmed = query.trim();
    return useQuery({ queryKey: ["ayahSearch", language, trimmed], queryFn: () => searchAyahs(trimmed, language), enabled: trimmed.length >= 3, staleTime: 5 * 60_000 });
}

/** One ayah with tajweed colours, e.g. a rule's example. */
export function useTajweedVerse(verseKey: string) {
    return useQuery({ queryKey: ["tajweedVerse", verseKey], queryFn: () => getTajweedVerse(verseKey), staleTime: Infinity });
}

/** Indonesian doa from equran.id (English uses the bundled dua); saved on the device once fetched, like the Surahs. */
export function useDuas(enabled = true) {
    return useQuery({ queryKey: ["duas"], queryFn: getDuas, staleTime: Infinity, enabled });
}

export function useAsmaulHusna() {
    return useQuery({ queryKey: ["asmaulHusna"], queryFn: getAsmaulHusna, staleTime: Infinity });
}
