// Reciters with per-ayah audio on equran.id, by their equran.id id. The full library comes in Phase 3.

export interface Reciter {
    id: string;
    name: string;
}

export const equranReciters: Reciter[] = [
    { id: "01", name: "Abdullah Al-Juhany" },
    { id: "02", name: "Abdul Muhsin Al-Qasim" },
    { id: "03", name: "Abdurrahman As-Sudais" },
    { id: "04", name: "Ibrahim Al-Dossari" },
    { id: "05", name: "Mishary Rashid Alafasy" },
    { id: "06", name: "Yasser Al-Dosari" },
];

export function reciterName(id: string): string {
    return equranReciters.find((reciter) => reciter.id === id)?.name ?? id;
}
