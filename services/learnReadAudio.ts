import { Asset } from "expo-asset";

// Recordings for the Learn to Read lessons, bundled with the app. Lessons show a play button only
// where a clip is listed here, so they keep working while recordings are still missing.
//
// Letter names (alif, ba', jim...): Ruaa GHAREEB on Wikimedia Commons, CC BY-SA 4.0, levelled and
// converted to AAC; see assets/audio/learn/names/LICENSE.md. These say the letter's name, not its
// fathah sound, so they play on the letter cards only.
//
// Fathah syllables (a, ba, ta...): none yet. They need a qualified reciter (see ROADMAP.md); add each
// file to assets/audio/learn/ and map it below by letter id, e.g. ba: require("@/assets/audio/learn/ba-fathah.m4a").

/** Metro turns each require() of a bundled file into a numeric module id. */
type Clips = Partial<Record<string, number>>;

const NAME_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/names/alif.m4a"),
    ba: require("@/assets/audio/learn/names/ba.m4a"),
    ta: require("@/assets/audio/learn/names/ta.m4a"),
    tha: require("@/assets/audio/learn/names/tha.m4a"),
    jim: require("@/assets/audio/learn/names/jim.m4a"),
    ha: require("@/assets/audio/learn/names/ha.m4a"),
    kha: require("@/assets/audio/learn/names/kha.m4a"),
    dal: require("@/assets/audio/learn/names/dal.m4a"),
    dhal: require("@/assets/audio/learn/names/dhal.m4a"),
    ra: require("@/assets/audio/learn/names/ra.m4a"),
    zay: require("@/assets/audio/learn/names/zay.m4a"),
    sin: require("@/assets/audio/learn/names/sin.m4a"),
    shin: require("@/assets/audio/learn/names/shin.m4a"),
    sad: require("@/assets/audio/learn/names/sad.m4a"),
    dad: require("@/assets/audio/learn/names/dad.m4a"),
    taa: require("@/assets/audio/learn/names/taa.m4a"),
    zaa: require("@/assets/audio/learn/names/zaa.m4a"),
    ayn: require("@/assets/audio/learn/names/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/names/ghayn.m4a"),
    fa: require("@/assets/audio/learn/names/fa.m4a"),
    qaf: require("@/assets/audio/learn/names/qaf.m4a"),
    kaf: require("@/assets/audio/learn/names/kaf.m4a"),
    lam: require("@/assets/audio/learn/names/lam.m4a"),
    mim: require("@/assets/audio/learn/names/mim.m4a"),
    nun: require("@/assets/audio/learn/names/nun.m4a"),
    haa: require("@/assets/audio/learn/names/haa.m4a"),
    waw: require("@/assets/audio/learn/names/waw.m4a"),
    ya: require("@/assets/audio/learn/names/ya.m4a"),
};

const FATHAH_CLIPS: Clips = {};

export type ClipKind = "name" | "fathah";

const clipsFor = (kind: ClipKind): Clips => (kind === "name" ? NAME_CLIPS : FATHAH_CLIPS);

export function hasClip(kind: ClipKind, letterId: string): boolean {
    return clipsFor(kind)[letterId] !== undefined;
}

/** A playable file URI for a letter's clip, or null when none is bundled. */
export async function clipUri(kind: ClipKind, letterId: string): Promise<string | null> {
    const moduleId = clipsFor(kind)[letterId];
    if (moduleId === undefined) return null;
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri ?? null;
}
