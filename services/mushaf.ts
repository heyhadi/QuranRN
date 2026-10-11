import { MUSHAF_PAGES } from "@/constants/surahPages";
import { getJson } from "./http";
import { parseTajweed, type TajweedSegment } from "./tajweed";

// One page of the 604-page Madani mushaf, rebuilt from quran.com's word data: every word knows its line
// (1 to 15). The Surah title and bismillah lines are not in the data, so they are worked out from where a
// Surah's first ayah falls on the page.

const BASE_URL = "https://api.quran.com/api/v4";

export interface MushafWord {
    text: string;
    /** The word split by tajweed rule, when the page data has the markup. */
    segments?: TajweedSegment[];
    surahNumber: number;
    ayahNumber: number;
    /** The ayah-end marker (the number in its circle) rather than a word. */
    isEnd: boolean;
}

export type MushafLine =
    | { kind: "header"; lineNumber: number; surahNumber: number }
    | { kind: "bismillah"; lineNumber: number }
    | { kind: "text"; lineNumber: number; words: MushafWord[] };

export interface MushafPage {
    number: number;
    lines: MushafLine[];
}

// Raw shape (only the fields read).
export interface MushafPageResponse {
    verses: {
        verse_key: string;
        verse_number: number;
        words: { position: number; char_type_name: string; text_uthmani: string | null; text_uthmani_tajweed?: string | null; line_number: number }[];
    }[];
}

/** Al-Fatihah (its bismillah is its first ayah) and At-Tawbah (it has none) have a title line only. */
const NO_BISMILLAH_LINE = new Set([1, 9]);

export function mapMushafPage(response: MushafPageResponse, pageNumber: number): MushafPage {
    const words = new Map<number, MushafWord[]>();
    /** line → the Surah whose first ayah begins that line. */
    const surahStarts = new Map<number, number>();

    for (const verse of response.verses) {
        const [surah, ayah] = verse.verse_key.split(":").map(Number);
        verse.words.forEach((word, index) => {
            const line = words.get(word.line_number) ?? [];
            const isEnd = word.char_type_name === "end";
            const segments = !isEnd && word.text_uthmani_tajweed ? parseTajweed(word.text_uthmani_tajweed) : undefined;
            line.push({ text: word.text_uthmani ?? "", ...(segments && segments.length > 0 ? { segments } : {}), surahNumber: surah, ayahNumber: ayah, isEnd });
            words.set(word.line_number, line);
            if (index === 0 && verse.verse_number === 1) surahStarts.set(word.line_number, surah);
        });
    }

    const lines: MushafLine[] = [];
    for (const [line, wordList] of words) lines.push({ kind: "text", lineNumber: line, words: wordList });
    for (const [firstLine, surahNumber] of surahStarts) {
        if (NO_BISMILLAH_LINE.has(surahNumber)) {
            lines.push({ kind: "header", lineNumber: firstLine - 1, surahNumber });
        } else {
            lines.push({ kind: "header", lineNumber: firstLine - 2, surahNumber });
            lines.push({ kind: "bismillah", lineNumber: firstLine - 1 });
        }
    }
    lines.sort((a, b) => a.lineNumber - b.lineNumber);
    return { number: pageNumber, lines };
}

export async function getMushafPage(pageNumber: number): Promise<MushafPage> {
    const response = await getJson<MushafPageResponse>(`${BASE_URL}/verses/by_page/${pageNumber}?words=true&word_fields=text_uthmani,text_uthmani_tajweed,line_number&per_page=300&mushaf=2`);
    return mapMushafPage(response, pageNumber);
}

export const isValidMushafPage = (page: number) => Number.isInteger(page) && page >= 1 && page <= MUSHAF_PAGES;
