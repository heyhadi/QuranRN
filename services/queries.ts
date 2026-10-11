import { useQuery } from "@tanstack/react-query";
import { getSurahDetail, getSurahList, getTafsir } from "./quranService";

// Quran text, translation and tafsir don't change, so cached data never goes stale.
// The cache is saved to disk (see store/storage.ts), which is what makes reading work offline.

export const queryKeys = {
    surahList: ["surahList"] as const,
    surah: (surahNumber: number) => ["surah", surahNumber] as const,
    tafsir: (surahNumber: number) => ["tafsir", surahNumber] as const,
};

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
