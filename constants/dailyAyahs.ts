// Short, well-known ayahs for the daily reminder, as "surah:ayah". The text is fetched when needed, so
// nothing here is typed from memory; only the references are. One is chosen per day, in a fixed rotation.

export const DAILY_AYAHS: readonly string[] = [
    "1:1", "1:2", "1:5", "2:152", "2:153", "2:186", "2:255", "2:286", "3:139", "3:173", "3:200", "4:103",
    "5:2", "13:28", "14:7", "16:128", "17:80", "18:10", "20:25", "20:114", "21:87", "23:118", "24:35", "29:69",
    "33:41", "39:53", "40:60", "42:19", "49:10", "55:13", "57:4", "59:22", "64:11", "65:2", "65:3", "93:5",
    "94:5", "94:6", "103:1", "103:2", "103:3", "112:1", "112:2", "113:1", "114:1",
];

/** The reference for a calendar day. The rotation is stable: the same date always gives the same ayah. */
export function dailyAyahFor(date: Date): string {
    const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
    return DAILY_AYAHS[((dayNumber % DAILY_AYAHS.length) + DAILY_AYAHS.length) % DAILY_AYAHS.length];
}
