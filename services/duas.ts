import { getJson } from "./http";

export interface Dua {
    id: number;
    group: string;
    title: string;
    arabic: string;
    transliteration: string;
    /** Indonesian meaning; equran.id has no English text for these. */
    meaning: string;
    source: string;
}

export interface DuaGroup {
    name: string;
    duas: Dua[];
}

export interface AsmaulHusnaName {
    number: number;
    arabic: string;
    transliteration: string;
    /** English meaning. */
    meaning: string;
}

// Raw shapes (only the fields read).
interface EquranDoaResponse {
    data: { id: number; grup: string; nama: string; ar: string; tr: string; idn: string; tentang?: string; tag?: string[] }[];
}
interface AsmaResponse {
    data: { name: string; transliteration: string; number: number; en: { meaning: string } }[];
}

export function mapDuas(response: EquranDoaResponse): Dua[] {
    return response.data.map((doa) => ({
        id: doa.id,
        group: doa.grup,
        title: doa.nama,
        arabic: doa.ar,
        transliteration: doa.tr,
        meaning: doa.idn,
        source: doa.tentang ?? "",
    }));
}

/** Group the duas under their headings, keeping the order the source lists them in. */
export function groupDuas(duas: Dua[]): DuaGroup[] {
    const groups = new Map<string, Dua[]>();
    for (const dua of duas) groups.set(dua.group, [...(groups.get(dua.group) ?? []), dua]);
    return [...groups].map(([name, items]) => ({ name, duas: items }));
}

/** Case-insensitive match on the title, group or Indonesian meaning. */
export function filterDuas(duas: Dua[], query: string): Dua[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return duas;
    return duas.filter((dua) => [dua.title, dua.group, dua.meaning].some((field) => field.toLowerCase().includes(needle)));
}

export function mapAsmaulHusna(response: AsmaResponse): AsmaulHusnaName[] {
    return response.data.map((name) => ({ number: name.number, arabic: name.name, transliteration: name.transliteration, meaning: name.en.meaning }));
}

export async function getDuas(): Promise<Dua[]> {
    return mapDuas(await getJson<EquranDoaResponse>("https://equran.id/api/doa"));
}

export async function getAsmaulHusna(): Promise<AsmaulHusnaName[]> {
    return mapAsmaulHusna(await getJson<AsmaResponse>("https://api.aladhan.com/v1/asmaAlHusna"));
}
