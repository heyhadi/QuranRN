// The tajweed rules that quran.com marks in its text (`text_uthmani_tajweed`), with a real example ayah
// for each. Rule names and explanations are in the locale files under "tajweed.rules.<id>".

export type TajweedRuleId =
    | "silent"
    | "ham_wasl"
    | "laam_shamsiyah"
    | "madda_normal"
    | "madda_permissible"
    | "madda_obligatory"
    | "madda_necessary"
    | "qalaqah"
    | "ikhafa"
    | "ikhafa_shafawi"
    | "ghunnah"
    | "iqlab"
    | "idgham_ghunnah"
    | "idgham_wo_ghunnah"
    | "idgham_shafawi"
    | "idgham_mutajanisayn"
    | "idgham_mutaqaribayn";

export interface TajweedRule {
    id: TajweedRuleId;
    /** The class name quran.com uses in its markup, when it differs from our id. */
    apiClass: string;
    /** The Arabic term. */
    arabic: string;
    /** Shortest real ayah that shows the rule, as "surah:ayah". */
    example: string;
}

export const tajweedRules: TajweedRule[] = [
    { id: "ham_wasl", apiClass: "ham_wasl", arabic: "همزة الوصل", example: "103:1" },
    { id: "laam_shamsiyah", apiClass: "laam_shamsiyah", arabic: "لام شمسية", example: "93:1" },
    { id: "silent", apiClass: "slnt", arabic: "حرف لا يُنطق", example: "20:28" },
    { id: "madda_normal", apiClass: "madda_normal", arabic: "مد طبيعي", example: "20:30" },
    { id: "madda_permissible", apiClass: "madda_permissible", arabic: "مد جائز", example: "56:22" },
    { id: "madda_obligatory", apiClass: "madda_obligatory", arabic: "مد واجب متصل", example: "80:30" },
    { id: "madda_necessary", apiClass: "madda_necessary", arabic: "مد لازم", example: "36:1" },
    { id: "qalaqah", apiClass: "qalaqah", arabic: "قلقلة", example: "96:17" },
    { id: "ikhafa", apiClass: "ikhafa", arabic: "إخفاء", example: "74:2" },
    { id: "ikhafa_shafawi", apiClass: "ikhafa_shafawi", arabic: "إخفاء شفوي", example: "88:22" },
    { id: "ghunnah", apiClass: "ghunnah", arabic: "غنة", example: "74:21" },
    { id: "iqlab", apiClass: "iqlab", arabic: "إقلاب", example: "80:16" },
    { id: "idgham_ghunnah", apiClass: "idgham_ghunnah", arabic: "إدغام بغنة", example: "80:28" },
    { id: "idgham_wo_ghunnah", apiClass: "idgham_wo_ghunnah", arabic: "إدغام بلا غنة", example: "56:3" },
    { id: "idgham_shafawi", apiClass: "idgham_shafawi", arabic: "إدغام شفوي", example: "26:60" },
    { id: "idgham_mutajanisayn", apiClass: "idgham_mutajanisayn", arabic: "إدغام متجانسين", example: "74:14" },
    { id: "idgham_mutaqaribayn", apiClass: "idgham_mutaqaribayn", arabic: "إدغام متقاربين", example: "4:158" },
];

const byApiClass = new Map(tajweedRules.map((rule) => [rule.apiClass, rule]));

/** Our rule for a class name in quran.com's markup, or undefined for one we don't know. */
export function ruleForApiClass(apiClass: string): TajweedRule | undefined {
    return byApiClass.get(apiClass);
}

export function getTajweedRule(id: TajweedRuleId): TajweedRule {
    return tajweedRules.find((rule) => rule.id === id)!;
}

/** Rules that share a colour in the text, so the legend shows one entry per colour family. */
export type TajweedColorKey = "silent" | "maddNormal" | "maddPermissible" | "maddObligatory" | "maddNecessary" | "qalqalah" | "ikhfa" | "ikhfaShafawi" | "ghunnah" | "iqlab" | "idghamGhunnah" | "idghamWithout" | "idghamShafawi";

export const tajweedColorKey: Record<TajweedRuleId, TajweedColorKey> = {
    silent: "silent",
    ham_wasl: "silent",
    laam_shamsiyah: "silent",
    madda_normal: "maddNormal",
    madda_permissible: "maddPermissible",
    madda_obligatory: "maddObligatory",
    madda_necessary: "maddNecessary",
    qalaqah: "qalqalah",
    ikhafa: "ikhfa",
    ikhafa_shafawi: "ikhfaShafawi",
    ghunnah: "ghunnah",
    iqlab: "iqlab",
    idgham_ghunnah: "idghamGhunnah",
    idgham_wo_ghunnah: "idghamWithout",
    idgham_shafawi: "idghamShafawi",
    idgham_mutajanisayn: "idghamWithout",
    idgham_mutaqaribayn: "idghamWithout",
};
