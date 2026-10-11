// quran.com sends translations and tafsir as small HTML fragments. These helpers turn them into
// plain structures the app can render with <Text>, so no WebView or HTML renderer is needed.

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", ndash: "–", mdash: "—" };

export function decodeEntities(text: string): string {
    return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
        if (code[0] === "#") {
            const value = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(value) ? String.fromCodePoint(value) : whole;
        }
        return ENTITIES[code.toLowerCase()] ?? whole;
    });
}

export interface TranslationSegment {
    text: string;
    italic?: boolean;
    /** Set on a footnote marker: tapping it should load this footnote. */
    footnoteId?: number;
}

const TRANSLATION_TAG = /<sup foot_note=(\d+)>(.*?)<\/sup>|<i[^>]*>(.*?)<\/i>/gs;

/** Split a translation into plain text, italic words (the translator's additions) and footnote markers. */
export function parseTranslation(html: string): TranslationSegment[] {
    const segments: TranslationSegment[] = [];
    const push = (segment: TranslationSegment) => {
        const text = decodeEntities(segment.text.replace(/<[^>]+>/g, ""));
        if (text) segments.push({ ...segment, text });
    };
    let cursor = 0;
    for (const match of html.matchAll(TRANSLATION_TAG)) {
        push({ text: html.slice(cursor, match.index) });
        cursor = match.index + match[0].length;
        if (match[1] !== undefined) push({ text: match[2], footnoteId: Number(match[1]) });
        else push({ text: match[3], italic: true });
    }
    push({ text: html.slice(cursor) });
    return segments;
}

/** The translation as one plain string, footnote markers removed, e.g. for sharing. */
export function translationText(html: string): string {
    return parseTranslation(html)
        .filter((segment) => segment.footnoteId === undefined)
        .map((segment) => segment.text)
        .join("");
}

export interface TextBlock {
    kind: "heading" | "paragraph";
    text: string;
}

/** Turn tafsir HTML (h2, p, br, li) into headings and paragraphs of plain text. */
export function htmlToBlocks(html: string): TextBlock[] {
    const blocks: TextBlock[] = [];
    const add = (kind: TextBlock["kind"], raw: string) => {
        const text = decodeEntities(raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n+/g, "\n")
            .trim();
        if (text) blocks.push({ kind, text });
    };
    const pattern = /<(h[1-6])[^>]*>(.*?)<\/\1>|<(p|li|blockquote|div)[^>]*>(.*?)<\/\3>/gis;
    let cursor = 0;
    for (const match of html.matchAll(pattern)) {
        add("paragraph", html.slice(cursor, match.index));
        cursor = match.index + match[0].length;
        if (match[1]) add("heading", match[2]);
        else add("paragraph", match[4]);
    }
    add("paragraph", html.slice(cursor));
    return blocks;
}

export interface HighlightSegment {
    text: string;
    highlight?: boolean;
}

/** Split a search snippet into plain and highlighted parts: "So, observe <em>patience</em>" → two segments. */
export function parseHighlight(html: string): HighlightSegment[] {
    const segments: HighlightSegment[] = [];
    const push = (raw: string, highlight?: boolean) => {
        const text = decodeEntities(raw.replace(/<[^>]+>/g, ""));
        if (text) segments.push(highlight ? { text, highlight } : { text });
    };
    let cursor = 0;
    for (const match of html.matchAll(/<em>(.*?)<\/em>/gs)) {
        push(html.slice(cursor, match.index));
        push(match[1], true);
        cursor = match.index + match[0].length;
    }
    push(html.slice(cursor));
    return segments;
}
