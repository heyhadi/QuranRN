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

const FATHAH_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/fathah/alif.m4a"),
    ba: require("@/assets/audio/learn/fathah/ba.m4a"),
    ta: require("@/assets/audio/learn/fathah/ta.m4a"),
    tha: require("@/assets/audio/learn/fathah/tha.m4a"),
    jim: require("@/assets/audio/learn/fathah/jim.m4a"),
    ha: require("@/assets/audio/learn/fathah/ha.m4a"),
    kha: require("@/assets/audio/learn/fathah/kha.m4a"),
    dal: require("@/assets/audio/learn/fathah/dal.m4a"),
    dhal: require("@/assets/audio/learn/fathah/dhal.m4a"),
    ra: require("@/assets/audio/learn/fathah/ra.m4a"),
    zay: require("@/assets/audio/learn/fathah/zay.m4a"),
    sin: require("@/assets/audio/learn/fathah/sin.m4a"),
    shin: require("@/assets/audio/learn/fathah/shin.m4a"),
    sad: require("@/assets/audio/learn/fathah/sad.m4a"),
    dad: require("@/assets/audio/learn/fathah/dad.m4a"),
    taa: require("@/assets/audio/learn/fathah/taa.m4a"),
    zaa: require("@/assets/audio/learn/fathah/zaa.m4a"),
    ayn: require("@/assets/audio/learn/fathah/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/fathah/ghayn.m4a"),
    fa: require("@/assets/audio/learn/fathah/fa.m4a"),
    qaf: require("@/assets/audio/learn/fathah/qaf.m4a"),
    kaf: require("@/assets/audio/learn/fathah/kaf.m4a"),
    lam: require("@/assets/audio/learn/fathah/lam.m4a"),
    mim: require("@/assets/audio/learn/fathah/mim.m4a"),
    nun: require("@/assets/audio/learn/fathah/nun.m4a"),
    haa: require("@/assets/audio/learn/fathah/haa.m4a"),
    waw: require("@/assets/audio/learn/fathah/waw.m4a"),
    ya: require("@/assets/audio/learn/fathah/ya.m4a"),
};

const KASRAH_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/kasrah/alif.m4a"),
    ba: require("@/assets/audio/learn/kasrah/ba.m4a"),
    ta: require("@/assets/audio/learn/kasrah/ta.m4a"),
    tha: require("@/assets/audio/learn/kasrah/tha.m4a"),
    jim: require("@/assets/audio/learn/kasrah/jim.m4a"),
    ha: require("@/assets/audio/learn/kasrah/ha.m4a"),
    kha: require("@/assets/audio/learn/kasrah/kha.m4a"),
    dal: require("@/assets/audio/learn/kasrah/dal.m4a"),
    dhal: require("@/assets/audio/learn/kasrah/dhal.m4a"),
    ra: require("@/assets/audio/learn/kasrah/ra.m4a"),
    zay: require("@/assets/audio/learn/kasrah/zay.m4a"),
    sin: require("@/assets/audio/learn/kasrah/sin.m4a"),
    shin: require("@/assets/audio/learn/kasrah/shin.m4a"),
    sad: require("@/assets/audio/learn/kasrah/sad.m4a"),
    dad: require("@/assets/audio/learn/kasrah/dad.m4a"),
    taa: require("@/assets/audio/learn/kasrah/taa.m4a"),
    zaa: require("@/assets/audio/learn/kasrah/zaa.m4a"),
    ayn: require("@/assets/audio/learn/kasrah/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/kasrah/ghayn.m4a"),
    fa: require("@/assets/audio/learn/kasrah/fa.m4a"),
    qaf: require("@/assets/audio/learn/kasrah/qaf.m4a"),
    kaf: require("@/assets/audio/learn/kasrah/kaf.m4a"),
    lam: require("@/assets/audio/learn/kasrah/lam.m4a"),
    mim: require("@/assets/audio/learn/kasrah/mim.m4a"),
    nun: require("@/assets/audio/learn/kasrah/nun.m4a"),
    haa: require("@/assets/audio/learn/kasrah/haa.m4a"),
    waw: require("@/assets/audio/learn/kasrah/waw.m4a"),
    ya: require("@/assets/audio/learn/kasrah/ya.m4a"),
};

const DAMMAH_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/dammah/alif.m4a"),
    ba: require("@/assets/audio/learn/dammah/ba.m4a"),
    ta: require("@/assets/audio/learn/dammah/ta.m4a"),
    tha: require("@/assets/audio/learn/dammah/tha.m4a"),
    jim: require("@/assets/audio/learn/dammah/jim.m4a"),
    ha: require("@/assets/audio/learn/dammah/ha.m4a"),
    kha: require("@/assets/audio/learn/dammah/kha.m4a"),
    dal: require("@/assets/audio/learn/dammah/dal.m4a"),
    dhal: require("@/assets/audio/learn/dammah/dhal.m4a"),
    ra: require("@/assets/audio/learn/dammah/ra.m4a"),
    zay: require("@/assets/audio/learn/dammah/zay.m4a"),
    sin: require("@/assets/audio/learn/dammah/sin.m4a"),
    shin: require("@/assets/audio/learn/dammah/shin.m4a"),
    sad: require("@/assets/audio/learn/dammah/sad.m4a"),
    dad: require("@/assets/audio/learn/dammah/dad.m4a"),
    taa: require("@/assets/audio/learn/dammah/taa.m4a"),
    zaa: require("@/assets/audio/learn/dammah/zaa.m4a"),
    ayn: require("@/assets/audio/learn/dammah/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/dammah/ghayn.m4a"),
    fa: require("@/assets/audio/learn/dammah/fa.m4a"),
    qaf: require("@/assets/audio/learn/dammah/qaf.m4a"),
    kaf: require("@/assets/audio/learn/dammah/kaf.m4a"),
    lam: require("@/assets/audio/learn/dammah/lam.m4a"),
    mim: require("@/assets/audio/learn/dammah/mim.m4a"),
    nun: require("@/assets/audio/learn/dammah/nun.m4a"),
    haa: require("@/assets/audio/learn/dammah/haa.m4a"),
    waw: require("@/assets/audio/learn/dammah/waw.m4a"),
    ya: require("@/assets/audio/learn/dammah/ya.m4a"),
};

const WORD_CLIPS: Clips = {
    w_khalaqa: require("@/assets/audio/learn/words/w_khalaqa.m4a"),
    w_kasaba: require("@/assets/audio/learn/words/w_kasaba.m4a"),
    w_waqaba: require("@/assets/audio/learn/words/w_waqaba.m4a"),
    w_hasada: require("@/assets/audio/learn/words/w_hasada.m4a"),
    w_samia: require("@/assets/audio/learn/words/w_samia.m4a"),
    w_alima: require("@/assets/audio/learn/words/w_alima.m4a"),
    w_shahida: require("@/assets/audio/learn/words/w_shahida.m4a"),
    w_rahima: require("@/assets/audio/learn/words/w_rahima.m4a"),
    w_ahadun: require("@/assets/audio/learn/words/w_ahadun.m4a"),
    w_samadu: require("@/assets/audio/learn/words/w_samadu.m4a"),
    w_kufuwan: require("@/assets/audio/learn/words/w_kufuwan.m4a"),
    w_maradun: require("@/assets/audio/learn/words/w_maradun.m4a"),
    w_alhamdu: require("@/assets/audio/learn/words/w_alhamdu.m4a"),
    w_rabbi: require("@/assets/audio/learn/words/w_rabbi.m4a"),
    w_maliki: require("@/assets/audio/learn/words/w_maliki.m4a"),
    w_nabudu: require("@/assets/audio/learn/words/w_nabudu.m4a"),
    sukun_qul: require("@/assets/audio/learn/sukun/sukun_qul.m4a"),
    sukun_min: require("@/assets/audio/learn/sukun/sukun_min.m4a"),
    sukun_lam: require("@/assets/audio/learn/sukun/sukun_lam.m4a"),
    sukun_qad: require("@/assets/audio/learn/sukun/sukun_qad.m4a"),
    sukun_an: require("@/assets/audio/learn/sukun/sukun_an.m4a"),
    sukun_hal: require("@/assets/audio/learn/sukun/sukun_hal.m4a"),
};

const FATHATAIN_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/fathatain/alif.m4a"),
    ba: require("@/assets/audio/learn/fathatain/ba.m4a"),
    ta: require("@/assets/audio/learn/fathatain/ta.m4a"),
    tha: require("@/assets/audio/learn/fathatain/tha.m4a"),
    jim: require("@/assets/audio/learn/fathatain/jim.m4a"),
    ha: require("@/assets/audio/learn/fathatain/ha.m4a"),
    kha: require("@/assets/audio/learn/fathatain/kha.m4a"),
    dal: require("@/assets/audio/learn/fathatain/dal.m4a"),
    dhal: require("@/assets/audio/learn/fathatain/dhal.m4a"),
    ra: require("@/assets/audio/learn/fathatain/ra.m4a"),
    zay: require("@/assets/audio/learn/fathatain/zay.m4a"),
    sin: require("@/assets/audio/learn/fathatain/sin.m4a"),
    shin: require("@/assets/audio/learn/fathatain/shin.m4a"),
    sad: require("@/assets/audio/learn/fathatain/sad.m4a"),
    dad: require("@/assets/audio/learn/fathatain/dad.m4a"),
    taa: require("@/assets/audio/learn/fathatain/taa.m4a"),
    zaa: require("@/assets/audio/learn/fathatain/zaa.m4a"),
    ayn: require("@/assets/audio/learn/fathatain/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/fathatain/ghayn.m4a"),
    fa: require("@/assets/audio/learn/fathatain/fa.m4a"),
    qaf: require("@/assets/audio/learn/fathatain/qaf.m4a"),
    kaf: require("@/assets/audio/learn/fathatain/kaf.m4a"),
    lam: require("@/assets/audio/learn/fathatain/lam.m4a"),
    mim: require("@/assets/audio/learn/fathatain/mim.m4a"),
    nun: require("@/assets/audio/learn/fathatain/nun.m4a"),
    haa: require("@/assets/audio/learn/fathatain/haa.m4a"),
    waw: require("@/assets/audio/learn/fathatain/waw.m4a"),
    ya: require("@/assets/audio/learn/fathatain/ya.m4a"),
};

const KASRATAIN_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/kasratain/alif.m4a"),
    ba: require("@/assets/audio/learn/kasratain/ba.m4a"),
    ta: require("@/assets/audio/learn/kasratain/ta.m4a"),
    tha: require("@/assets/audio/learn/kasratain/tha.m4a"),
    jim: require("@/assets/audio/learn/kasratain/jim.m4a"),
    ha: require("@/assets/audio/learn/kasratain/ha.m4a"),
    kha: require("@/assets/audio/learn/kasratain/kha.m4a"),
    dal: require("@/assets/audio/learn/kasratain/dal.m4a"),
    dhal: require("@/assets/audio/learn/kasratain/dhal.m4a"),
    ra: require("@/assets/audio/learn/kasratain/ra.m4a"),
    zay: require("@/assets/audio/learn/kasratain/zay.m4a"),
    sin: require("@/assets/audio/learn/kasratain/sin.m4a"),
    shin: require("@/assets/audio/learn/kasratain/shin.m4a"),
    sad: require("@/assets/audio/learn/kasratain/sad.m4a"),
    dad: require("@/assets/audio/learn/kasratain/dad.m4a"),
    taa: require("@/assets/audio/learn/kasratain/taa.m4a"),
    zaa: require("@/assets/audio/learn/kasratain/zaa.m4a"),
    ayn: require("@/assets/audio/learn/kasratain/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/kasratain/ghayn.m4a"),
    fa: require("@/assets/audio/learn/kasratain/fa.m4a"),
    qaf: require("@/assets/audio/learn/kasratain/qaf.m4a"),
    kaf: require("@/assets/audio/learn/kasratain/kaf.m4a"),
    lam: require("@/assets/audio/learn/kasratain/lam.m4a"),
    mim: require("@/assets/audio/learn/kasratain/mim.m4a"),
    nun: require("@/assets/audio/learn/kasratain/nun.m4a"),
    haa: require("@/assets/audio/learn/kasratain/haa.m4a"),
    waw: require("@/assets/audio/learn/kasratain/waw.m4a"),
    ya: require("@/assets/audio/learn/kasratain/ya.m4a"),
};

const DAMMATAIN_CLIPS: Clips = {
    alif: require("@/assets/audio/learn/dammatain/alif.m4a"),
    ba: require("@/assets/audio/learn/dammatain/ba.m4a"),
    ta: require("@/assets/audio/learn/dammatain/ta.m4a"),
    tha: require("@/assets/audio/learn/dammatain/tha.m4a"),
    jim: require("@/assets/audio/learn/dammatain/jim.m4a"),
    ha: require("@/assets/audio/learn/dammatain/ha.m4a"),
    kha: require("@/assets/audio/learn/dammatain/kha.m4a"),
    dal: require("@/assets/audio/learn/dammatain/dal.m4a"),
    dhal: require("@/assets/audio/learn/dammatain/dhal.m4a"),
    ra: require("@/assets/audio/learn/dammatain/ra.m4a"),
    zay: require("@/assets/audio/learn/dammatain/zay.m4a"),
    sin: require("@/assets/audio/learn/dammatain/sin.m4a"),
    shin: require("@/assets/audio/learn/dammatain/shin.m4a"),
    sad: require("@/assets/audio/learn/dammatain/sad.m4a"),
    dad: require("@/assets/audio/learn/dammatain/dad.m4a"),
    taa: require("@/assets/audio/learn/dammatain/taa.m4a"),
    zaa: require("@/assets/audio/learn/dammatain/zaa.m4a"),
    ayn: require("@/assets/audio/learn/dammatain/ayn.m4a"),
    ghayn: require("@/assets/audio/learn/dammatain/ghayn.m4a"),
    fa: require("@/assets/audio/learn/dammatain/fa.m4a"),
    qaf: require("@/assets/audio/learn/dammatain/qaf.m4a"),
    kaf: require("@/assets/audio/learn/dammatain/kaf.m4a"),
    lam: require("@/assets/audio/learn/dammatain/lam.m4a"),
    mim: require("@/assets/audio/learn/dammatain/mim.m4a"),
    nun: require("@/assets/audio/learn/dammatain/nun.m4a"),
    haa: require("@/assets/audio/learn/dammatain/haa.m4a"),
    waw: require("@/assets/audio/learn/dammatain/waw.m4a"),
    ya: require("@/assets/audio/learn/dammatain/ya.m4a"),
};

const SUKUN_CLIPS: Clips = {
    sukun_qul: require("@/assets/audio/learn/sukun/sukun_qul.m4a"),
    sukun_min: require("@/assets/audio/learn/sukun/sukun_min.m4a"),
    sukun_lam: require("@/assets/audio/learn/sukun/sukun_lam.m4a"),
    sukun_qad: require("@/assets/audio/learn/sukun/sukun_qad.m4a"),
    sukun_an: require("@/assets/audio/learn/sukun/sukun_an.m4a"),
    sukun_hal: require("@/assets/audio/learn/sukun/sukun_hal.m4a"),
};

export type ClipKind = "name" | "fathah" | "kasrah" | "dammah" | "fathatain" | "kasratain" | "dammatain" | "sukun" | "word";

const clipsFor = (kind: ClipKind): Clips => {
    switch (kind) {
        case "name":
            return NAME_CLIPS;
        case "fathah":
            return FATHAH_CLIPS;
        case "kasrah":
            return KASRAH_CLIPS;
        case "dammah":
            return DAMMAH_CLIPS;
        case "fathatain":
            return FATHATAIN_CLIPS;
        case "kasratain":
            return KASRATAIN_CLIPS;
        case "dammatain":
            return DAMMATAIN_CLIPS;
        case "sukun":
            return SUKUN_CLIPS;
        case "word":
            return WORD_CLIPS;
        default:
            return {};
    }
};

export function hasClip(kind: ClipKind, letterOrWordId: string): boolean {
    if (clipsFor(kind)[letterOrWordId] !== undefined) return true;
    if (kind === "word") {
        return letterOrWordId.startsWith("http://") || letterOrWordId.startsWith("https://");
    }
    return false;
}

/** A playable file URI for a letter's clip or word URL, or null when none is available. */
export async function clipUri(kind: ClipKind, letterOrWordId: string): Promise<string | null> {
    const moduleId = clipsFor(kind)[letterOrWordId];
    if (moduleId !== undefined) {
        const asset = Asset.fromModule(moduleId);
        await asset.downloadAsync();
        return asset.localUri ?? asset.uri ?? null;
    }
    if (kind === "word" && (letterOrWordId.startsWith("http://") || letterOrWordId.startsWith("https://"))) {
        return letterOrWordId;
    }
    return null;
}

