import { getJson } from "./http";
import { mapTajweedChapter, parseTajweed, type QuranComTajweedResponse, type TajweedSegment } from "./tajweed";

// api.quran.com v4: free, no key. Used for what equran.id does not have: tajweed markup, English
// translations, word-by-word, other tafsirs and ayah search.
const BASE_URL = "https://api.quran.com/api/v4";
const WORD_AUDIO_URL = "https://verses.quran.com/";

// ---- Raw response shapes (only the fields read) ----

interface TranslationsResponse {
    translations: { text: string }[];
}

interface WordsResponse {
    verse: {
        words: {
            position: number;
            char_type_name: string;
            text_uthmani: string | null;
            transliteration: { text: string | null };
            translation: { text: string | null };
            audio_url: string | null;
        }[];
    };
}

interface TafsirResponse {
    tafsir: { resource_name: string; text: string; verses: Record<string, unknown> };
}

interface FootnoteResponse {
    foot_note: { text: string };
}

interface SearchResponse {
    search: {
        total_results: number;
        results: { verse_key: string; text: string; translations?: { text: string }[] }[];
    };
}

// ---- App shapes ----

export interface Word {
    position: number;
    arabic: string;
    transliteration: string;
    meaning: string;
    /** Full URL of the recording of just this word, or null. */
    audioUrl: string | null;
}

export interface QuranComTafsir {
    editionName: string;
    /** HTML, as sent; render it with htmlToBlocks. */
    html: string;
}

export interface AyahSearchResult {
    surahNumber: number;
    ayahNumber: number;
    arabic: string;
    /** Translation snippet; may contain <em> around the matched words. */
    snippet: string;
}

// ---- Mappers (pure, tested) ----

/** Translation HTML by ayah number, in order, for one Surah. */
export function mapTranslations(response: TranslationsResponse): Record<number, string> {
    return Object.fromEntries(response.translations.map((translation, index) => [index + 1, translation.text]));
}

export function mapWords(response: WordsResponse): Word[] {
    return response.verse.words
        .filter((word) => word.char_type_name === "word")
        .map((word) => ({
            position: word.position,
            arabic: word.text_uthmani ?? "",
            transliteration: word.transliteration.text ?? "",
            meaning: word.translation.text ?? "",
            audioUrl: word.audio_url ? WORD_AUDIO_URL + word.audio_url : null,
        }));
}

export function mapTafsir(response: TafsirResponse): QuranComTafsir {
    return { editionName: response.tafsir.resource_name, html: response.tafsir.text };
}

export function mapSearch(response: SearchResponse): AyahSearchResult[] {
    return response.search.results.map((result) => {
        const [surah, ayah] = result.verse_key.split(":").map(Number);
        return { surahNumber: surah, ayahNumber: ayah, arabic: result.text, snippet: result.translations?.[0]?.text ?? "" };
    });
}

// ---- Fetchers ----

export async function getTajweed(surahNumber: number): Promise<Record<number, TajweedSegment[]>> {
    return mapTajweedChapter(await getJson<QuranComTajweedResponse>(`${BASE_URL}/quran/verses/uthmani_tajweed?chapter_number=${surahNumber}`));
}

/** One ayah's tajweed text, by "surah:ayah". */
export async function getTajweedVerse(verseKey: string): Promise<TajweedSegment[]> {
    const response = await getJson<QuranComTajweedResponse>(`${BASE_URL}/quran/verses/uthmani_tajweed?verse_key=${verseKey}`);
    return parseTajweed(response.verses[0]?.text_uthmani_tajweed ?? "");
}

export async function getTranslation(surahNumber: number, editionId: number): Promise<Record<number, string>> {
    return mapTranslations(await getJson<TranslationsResponse>(`${BASE_URL}/quran/translations/${editionId}?chapter_number=${surahNumber}`));
}

export async function getWords(surahNumber: number, ayahNumber: number, language: "en" | "id"): Promise<Word[]> {
    return mapWords(await getJson<WordsResponse>(`${BASE_URL}/verses/by_key/${surahNumber}:${ayahNumber}?words=true&language=${language}&word_fields=text_uthmani`));
}

export async function getQuranComTafsir(editionId: number, surahNumber: number, ayahNumber: number): Promise<QuranComTafsir> {
    return mapTafsir(await getJson<TafsirResponse>(`${BASE_URL}/tafsirs/${editionId}/by_ayah/${surahNumber}:${ayahNumber}`));
}

export async function getFootnote(footnoteId: number): Promise<string> {
    return (await getJson<FootnoteResponse>(`${BASE_URL}/foot_notes/${footnoteId}`)).foot_note.text;
}

export async function searchAyahs(query: string, language: "en" | "id", size = 20): Promise<AyahSearchResult[]> {
    const params = `q=${encodeURIComponent(query)}&size=${size}&language=${language}`;
    return mapSearch(await getJson<SearchResponse>(`${BASE_URL}/search?${params}`));
}
