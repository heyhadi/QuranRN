import { ruleForApiClass, type TajweedRuleId } from "@/constants/tajweed";

/** A run of Arabic text, with the tajweed rule that applies to it, if any. */
export interface TajweedSegment {
    text: string;
    rule?: TajweedRuleId;
}

// The ayah text uses <tajweed class=…>; the per-word text on a mushaf page uses <rule class=…>, and
// those can nest (a Madd rule around a silent letter), so the text is read with a small stack.
const TOKEN = /<(?:tajweed|rule) class=([a-z_-]+)>|<\/(?:tajweed|rule)>|<span class=end>.*?<\/span>/gs;

/**
 * Turn quran.com's tajweed markup into segments, e.g.
 * `قُلْ هُوَ <tajweed class=ham_wasl>ٱ</tajweed>للَّهُ` → three segments, the middle one tagged `ham_wasl`.
 * The innermost rule colours its letters. The ayah-end marker is dropped (the reader draws its own), and a
 * class we don't know (such as the `custom-…` wrappers) leaves its letters to the rule around it.
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
    const stack: (TajweedRuleId | undefined)[] = [];
    const current = () => {
        for (let i = stack.length - 1; i >= 0; i--) if (stack[i]) return stack[i];
        return undefined;
    };

    let cursor = 0;
    for (const match of markup.matchAll(TOKEN)) {
        push(markup.slice(cursor, match.index), current());
        cursor = match.index + match[0].length;
        const [token, apiClass] = match;
        if (apiClass !== undefined) stack.push(ruleForApiClass(apiClass)?.id);
        else if (token.startsWith("</")) stack.pop();
    }
    push(markup.slice(cursor), current());
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
