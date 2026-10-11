import { MUSHAF_PAGES } from "@/constants/surahPages";

/** A printed page is about 0.55 times as wide as it is tall. */
export const PAGE_ASPECT = 0.55;
export const SIDE_MARGIN = 16;
/** Space between the two pages of a spread. */
export const SPREAD_GAP = 12;
/** One page never gets wider than this, however big the screen is. */
export const MAX_SINGLE_WIDTH = 640;

export interface MushafLayout {
    /** Two pages side by side, like an open book. */
    spread: boolean;
    pageWidth: number;
    pageHeight: number;
}

/**
 * How big a page is on this screen. The page keeps its proportions: if two pages at that size fit across
 * (a tablet turned sideways) they are shown as a spread, otherwise one page is shown, as wide as the screen
 * allows up to a reading width.
 */
export function mushafLayout(availableWidth: number, availableHeight: number, footerHeight: number): MushafLayout {
    const pageHeight = Math.max(0, availableHeight - footerHeight);
    const fitWidth = pageHeight * PAGE_ASPECT;
    const spreadWidth = fitWidth * 2 + SPREAD_GAP + SIDE_MARGIN * 2;
    if (availableWidth >= spreadWidth) return { spread: true, pageWidth: fitWidth, pageHeight };
    return { spread: false, pageWidth: Math.min(availableWidth - SIDE_MARGIN * 2, MAX_SINGLE_WIDTH, fitWidth), pageHeight };
}

/** A spread holds an odd page (on the right, as in a printed mushaf) and the even page facing it. */
export const SPREADS = Math.ceil(MUSHAF_PAGES / 2);

export function spreadIndexOf(page: number): number {
    return Math.floor((page - 1) / 2);
}

export function pagesOfSpread(index: number): [right: number, left: number | null] {
    const right = index * 2 + 1;
    return [right, right + 1 <= MUSHAF_PAGES ? right + 1 : null];
}

/** The list position of a page: its own, or the spread it is in. */
export function listIndexOf(page: number, spread: boolean): number {
    return spread ? spreadIndexOf(page) : page - 1;
}

/** The first page shown at a list position. */
export function pageAt(index: number, spread: boolean): number {
    return spread ? index * 2 + 1 : index + 1;
}
