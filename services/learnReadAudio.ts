import { Asset } from "expo-asset";

// Recordings for the Learn to Read lessons, one short clip per syllable, bundled with the app.
//
// No clips are bundled yet: they need a qualified reciter and a clear licence (see ROADMAP.md).
// To add one, put the file in assets/audio/learn/ and map it here by letter id, e.g.
//     ba: require("@/assets/audio/learn/ba-fathah.m4a"),
// Lessons show a play button only for syllables listed here, so they work without audio meanwhile.

/** Metro turns each require() of a bundled file into a numeric module id. */
const FATHAH_CLIPS: Partial<Record<string, number>> = {};

export function hasFathahClip(letterId: string): boolean {
    return FATHAH_CLIPS[letterId] !== undefined;
}

/** A playable file URI for a letter's fathah clip, or null when none is bundled. */
export async function fathahClipUri(letterId: string): Promise<string | null> {
    const moduleId = FATHAH_CLIPS[letterId];
    if (moduleId === undefined) return null;
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri ?? null;
}
