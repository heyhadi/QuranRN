import type { SurahSummary } from "./types";

// "Al-Baqarah", "al baqarah" and "albaqarah" should all match.
function normalise(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Match a search query against a Surah's Latin name, meaning or number. */
export function filterSurahs(surahs: SurahSummary[], query: string): SurahSummary[] {
    const trimmed = query.trim();
    if (!trimmed) return surahs;
    if (/^\d+$/.test(trimmed)) {
        return surahs.filter((surah) => surah.number === Number(trimmed));
    }
    const needle = normalise(trimmed);
    return surahs.filter(
        (surah) => normalise(surah.nameLatin).includes(needle) || normalise(surah.meaning).includes(needle),
    );
}
