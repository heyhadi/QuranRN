// Reciters with per-ayah audio. Each ayah is its own file, which is what ayah highlighting, repeat
// and hifz mode need. Every folder here was checked against the first and last ayah of the Quran
// (see services/__tests__/reciters.test.ts for the URL shapes).

export type ReciterStyle = "Murattal" | "Mujawwad" | "Muallim";

export type ReciterSource =
    /** https://cdn.equran.id/audio-partial/{folder}/{SSS}{AAA}.mp3 */
    | { kind: "equran"; folder: string }
    /** https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3 */
    | { kind: "everyayah"; folder: string };

export interface Reciter {
    id: string;
    name: string;
    /** The name listeners know the reciter by, shown on the tile. */
    arabic: string;
    styles: ReciterStyle[];
    source: ReciterSource;
    /** An everyayah.com folder with smaller files (checked against the first and last ayah), for the data saver. */
    dataSaver?: string;
    /** Arabic recitation followed by an English audio translation. */
    englishAudio?: boolean;
    /** Shown first in the picker. */
    popular?: boolean;
}

const everyayah = (folder: string): ReciterSource => ({ kind: "everyayah", folder });
const equran = (folder: string): ReciterSource => ({ kind: "equran", folder });

export const reciters: Reciter[] = [
    { id: "alafasy", name: "Mishary Rashid Alafasy", arabic: "العفاسي", styles: ["Murattal"], source: everyayah("Alafasy_128kbps"), dataSaver: "Alafasy_64kbps", popular: true },
    { id: "sudais", name: "Abdurrahman As-Sudais", arabic: "السديس", styles: ["Murattal"], source: everyayah("Abdurrahmaan_As-Sudais_192kbps"), dataSaver: "Abdurrahmaan_As-Sudais_64kbps", popular: true },
    { id: "yasser-dosari", name: "Yasser Al-Dosari", arabic: "الدوسري", styles: ["Murattal"], source: everyayah("Yasser_Ad-Dussary_128kbps"), popular: true },
    { id: "muaiqly", name: "Maher Al-Muaiqly", arabic: "المعيقلي", styles: ["Murattal"], source: everyayah("MaherAlMuaiqly128kbps"), popular: true },
    { id: "shuraym", name: "Saud Ash-Shuraym", arabic: "الشريم", styles: ["Murattal"], source: everyayah("Saood_ash-Shuraym_128kbps"), dataSaver: "Saood_ash-Shuraym_64kbps", popular: true },
    { id: "abdul-basit", name: "Abdul Basit Abdus Samad", arabic: "عبد الباسط", styles: ["Murattal"], source: everyayah("Abdul_Basit_Murattal_192kbps"), dataSaver: "Abdul_Basit_Murattal_64kbps" },
    { id: "abdul-basit-mujawwad", name: "Abdul Basit Abdus Samad", arabic: "عبد الباسط", styles: ["Mujawwad"], source: everyayah("Abdul_Basit_Mujawwad_128kbps") },
    { id: "husary", name: "Mahmoud Khalil Al-Husary", arabic: "الحصري", styles: ["Murattal"], source: everyayah("Husary_128kbps"), dataSaver: "Husary_64kbps" },
    { id: "husary-mujawwad", name: "Mahmoud Khalil Al-Husary", arabic: "الحصري", styles: ["Mujawwad"], source: everyayah("Husary_128kbps_Mujawwad") },
    { id: "husary-muallim", name: "Mahmoud Khalil Al-Husary", arabic: "الحصري", styles: ["Muallim"], source: everyayah("Husary_Muallim_128kbps") },
    { id: "minshawi", name: "Mohamed Siddiq Al-Minshawi", arabic: "المنشاوي", styles: ["Murattal"], source: everyayah("Minshawy_Murattal_128kbps") },
    { id: "minshawi-mujawwad", name: "Mohamed Siddiq Al-Minshawi", arabic: "المنشاوي", styles: ["Mujawwad"], source: everyayah("Minshawy_Mujawwad_192kbps"), dataSaver: "Minshawy_Mujawwad_64kbps" },
    { id: "qatami", name: "Nasser Al-Qatami", arabic: "القطامي", styles: ["Murattal"], source: everyayah("Nasser_Alqatami_128kbps") },
    { id: "ajamy", name: "Ahmed Al-Ajamy", arabic: "العجمي", styles: ["Murattal"], source: everyayah("ahmed_ibn_ali_al_ajamy_128kbps") },
    { id: "ghamdi", name: "Saad Al-Ghamdi", arabic: "الغامدي", styles: ["Murattal"], source: everyayah("Ghamadi_40kbps") },
    { id: "shatri", name: "Abu Bakr Ash-Shatri", arabic: "الشاطري", styles: ["Murattal"], source: everyayah("Abu_Bakr_Ash-Shaatree_128kbps"), dataSaver: "Abu_Bakr_Ash-Shaatree_64kbps" },
    { id: "rifai", name: "Hani Ar-Rifai", arabic: "الرفاعي", styles: ["Murattal"], source: everyayah("Hani_Rifai_192kbps"), dataSaver: "Hani_Rifai_64kbps" },
    { id: "budair", name: "Salah Al-Budair", arabic: "البدير", styles: ["Murattal"], source: everyayah("Salah_Al_Budair_128kbps") },
    { id: "fares-abbad", name: "Fares Abbad", arabic: "عباد", styles: ["Murattal"], source: everyayah("Fares_Abbad_64kbps") },
    { id: "jibreel", name: "Muhammad Jibreel", arabic: "جبريل", styles: ["Murattal"], source: everyayah("Muhammad_Jibreel_128kbps"), dataSaver: "Muhammad_Jibreel_64kbps" },
    // The 64 kbps folder is missing on everyayah.com; the 32 kbps one has every ayah.
    { id: "akhdar", name: "Ibrahim Al-Akhdar", arabic: "الأخضر", styles: ["Murattal"], source: everyayah("Ibrahim_Akhdar_32kbps") },
    { id: "basfar", name: "Abdullah Basfar", arabic: "بصفر", styles: ["Murattal"], source: everyayah("Abdullah_Basfar_192kbps"), dataSaver: "Abdullah_Basfar_64kbps" },
    { id: "hudhaify", name: "Ali Al-Hudhaify", arabic: "الحذيفي", styles: ["Murattal"], source: everyayah("Hudhaify_128kbps"), dataSaver: "Hudhaify_64kbps" },
    { id: "juhany", name: "Abdullah Al-Juhany", arabic: "الجهني", styles: ["Murattal"], source: equran("Abdullah-Al-Juhany") },
    { id: "qasim", name: "Abdul Muhsin Al-Qasim", arabic: "القاسم", styles: ["Murattal"], source: equran("Abdul-Muhsin-Al-Qasim") },
    { id: "ibrahim-dossari", name: "Ibrahim Al-Dossari", arabic: "إبراهيم", styles: ["Murattal"], source: equran("Ibrahim-Al-Dossari") },
    {
        id: "basfar-walk",
        name: "Basfar + Ibrahim Walk",
        arabic: "بصفر",
        styles: ["Murattal"],
        source: everyayah("MultiLanguage/Basfar_Walk_192kbps"),
        englishAudio: true,
    },
];

export type AudioQuality = "standard" | "dataSaver";

export const DEFAULT_RECITER_ID = "alafasy";

/** Settings saved before the library existed used equran.id's numeric reciter ids. */
export const legacyReciterIds: Record<string, string> = {
    "01": "juhany",
    "02": "qasim",
    "03": "sudais",
    "04": "ibrahim-dossari",
    "05": "alafasy",
    "06": "yasser-dosari",
};

export function getReciter(id: string): Reciter {
    return reciters.find((reciter) => reciter.id === id) ?? reciters.find((reciter) => reciter.id === DEFAULT_RECITER_ID)!;
}

/** The recitation file for one ayah, e.g. Al-Baqarah 255 → …/002255.mp3. */
export function ayahAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number, quality: AudioQuality = "standard"): string {
    const { source, dataSaver } = getReciter(reciterId);
    const file = `${String(surahNumber).padStart(3, "0")}${String(ayahNumber).padStart(3, "0")}.mp3`;
    if (source.kind === "equran") return `https://cdn.equran.id/audio-partial/${source.folder}/${file}`;
    return `https://everyayah.com/data/${quality === "dataSaver" && dataSaver ? dataSaver : source.folder}/${file}`;
}

/** How many reciters have a smaller version for the data saver; the rest stay as they are. */
export const dataSaverCount = reciters.filter((reciter) => reciter.dataSaver).length;

/** Display label for a reciter's styles, e.g. "Murattal" or "Murattal, Mujawwad". */
export function styleLabel(reciter: Reciter): string {
    return reciter.styles.join(", ");
}
