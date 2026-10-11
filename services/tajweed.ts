import { ruleForApiClass, type TajweedRuleId } from "@/constants/tajweed";

/** A run of Arabic text, with the tajweed rule that applies to it, if any. */
export interface TajweedSegment {
    text: string;
    rule?: TajweedRuleId;
}

const TAG = /<tajweed class=([a-z_]+)>(.*?)<\/tajweed>|<span class=end>.*?<\/span>/gs;

/**
 * Turn quran.com's `text_uthmani_tajweed` markup into segments, e.g.
 * `قُلْ هُوَ <tajweed class=ham_wasl>ٱ</tajweed>للَّهُ` → three segments, the middle one tagged `ham_wasl`.
 * The ayah-end marker is dropped (the reader draws its own), and a class we don't know is kept as plain text.
 */
export function parseTajweed(markup: string): TajweedSegment[] {
    const segments: TajweedSegment[] = [];
    const push = (text: string, rule?: TajweedRuleId) => {
        if (!text) return;
        const last = segments[segments.length - 1];
        // Merge neighbouring plain runs so the reader renders as few nested Text nodes as possible.
        if (last && !last.rule && !rule) last.text += text;
        else segments.push(rule ? { text, rule } : { text });
    };

    let cursor = 0;
    for (const match of markup.matchAll(TAG)) {
        push(markup.slice(cursor, match.index));
        cursor = match.index + match[0].length;
        const [, apiClass, text] = match;
        if (apiClass !== undefined) push(text, ruleForApiClass(apiClass)?.id);
    }
    push(markup.slice(cursor));
    return trimEnd(segments);
}

function trimEnd(segments: TajweedSegment[]): TajweedSegment[] {
    const last = segments[segments.length - 1];
    if (last && !last.rule) {
        last.text = last.text.trimEnd();
        if (!last.text) segments.pop();
    }
    return segments;
}

// Raw shape from https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=N.
export interface QuranComTajweedResponse {
    verses: { verse_key: string; text_uthmani_tajweed: string }[];
}

/** Tajweed segments keyed by ayah number for one Surah. */
export function mapTajweedChapter(response: QuranComTajweedResponse): Record<number, TajweedSegment[]> {
    return Object.fromEntries(response.verses.map((verse) => [Number(verse.verse_key.split(":")[1]), parseTajweed(verse.text_uthmani_tajweed)]));
}

/** The text without any colouring, e.g. to copy or share. */
export function plainText(segments: TajweedSegment[]): string {
    return segments.map((segment) => segment.text).join("");
}
