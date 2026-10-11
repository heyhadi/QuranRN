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
    return segments.map((segment) => segment.text).join("").replace(/\u200D/g, "");
}

// ---- Safe to draw on Android ----
//
// Android shapes every coloured run of a nested <Text> separately, so at each colour boundary a letter loses
// its connection to its neighbour, and a vowel mark that starts a run has no letter to sit on. iOS shapes
// across runs and hides the problem. The two steps below make the runs safe to draw on Android.

const MARK = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08FF]/;
/** Letters that take a joined form on at least one side (hamza on its own never joins). */
const JOINING_LETTER = /[\u0622-\u064A\u0640\u066E-\u06D3\u0750-\u077F]/;
/** Letters that never join to the letter after them. */
const NO_JOIN_FORWARD = /[\u0621-\u0625\u0627\u0629\u062F-\u0632\u0648\u0671-\u0673\u0675-\u0677\u0688-\u0699\u06D2\u06D3]/;
const ZWJ = "\u200D";

/**
 * Re-cut the colour runs so Android draws them right. A letter and its vowel marks always stay in one run
 * (the whole group takes the colour of the rule on its marks, or its own), and where two runs meet in the
 * middle of a joined word a zero-width joiner keeps the letters connected.
 */
export function shapeSafe(segments: TajweedSegment[]): TajweedSegment[] {
    // 1. Groups of a letter and its marks, each with one rule.
    const groups: { text: string; rule?: TajweedRuleId }[] = [];
    for (const segment of segments) {
        for (const char of segment.text) {
            const last = groups[groups.length - 1];
            if (last && MARK.test(char)) {
                last.text += char;
                if (segment.rule) last.rule = segment.rule;
            } else groups.push({ text: char, rule: segment.rule });
        }
    }

    // 2. Neighbouring groups with the same rule become one run again.
    const runs: TajweedSegment[] = [];
    for (const group of groups) {
        const last = runs[runs.length - 1];
        if (last && last.rule === group.rule) last.text += group.text;
        else runs.push(group.rule ? { text: group.text, rule: group.rule } : { text: group.text });
    }

    // 3. Keep the letters joined across a boundary between two runs.
    for (let i = 1; i < runs.length; i++) {
        const lastLetter = [...runs[i - 1].text].reverse().find((char) => !MARK.test(char) && char !== ZWJ);
        const firstChar = runs[i].text[0];
        if (lastLetter && JOINING_LETTER.test(lastLetter) && !NO_JOIN_FORWARD.test(lastLetter) && JOINING_LETTER.test(firstChar)) {
            runs[i - 1].text += ZWJ;
            runs[i].text = ZWJ + runs[i].text;
        }
    }
    return runs;
}
