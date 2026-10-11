// The first and last page of each Surah in the 604-page Madani mushaf (Surah 1 to 114), from quran.com's
// chapter data. Used to open the mushaf at the right page and to link a Surah to its pages.

export const SURAH_FIRST_PAGE: readonly number[] = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604];

export const SURAH_LAST_PAGE: readonly number[] = [1, 49, 76, 106, 127, 150, 176, 186, 207, 221, 235, 248, 255, 261, 267, 281, 293, 304, 312, 321, 331, 341, 349, 359, 366, 376, 385, 396, 404, 410, 414, 417, 427, 434, 440, 445, 452, 458, 467, 476, 482, 489, 495, 498, 502, 506, 510, 515, 517, 520, 523, 525, 528, 531, 534, 537, 541, 545, 548, 551, 552, 554, 555, 557, 559, 561, 564, 566, 568, 570, 571, 573, 575, 577, 578, 580, 581, 583, 584, 585, 586, 587, 589, 589, 590, 591, 592, 592, 594, 594, 595, 596, 596, 596, 597, 597, 598, 599, 599, 600, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604];

export const MUSHAF_PAGES = 604;

export function firstPageOf(surahNumber: number): number {
    return SURAH_FIRST_PAGE[surahNumber - 1] ?? 1;
}

/** The Surah that holds a page's first line (the one a reader is in when they open the page). */
export function surahOnPage(page: number): number {
    for (let surah = 114; surah >= 1; surah--) if (SURAH_FIRST_PAGE[surah - 1] <= page) return surah;
    return 1;
}

/** The bismillah as it is written at the head of a Surah. */
export const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
