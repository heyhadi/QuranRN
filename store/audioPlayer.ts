import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { create } from "zustand";
import { ayahAudioUrl, getReciter } from "@/constants/reciters";
import { localAyahUri } from "@/services/audioDownloads";
import { useSettingsStore } from "./settings";

export interface Track {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
}

export type PlaybackStatus = "stopped" | "playing" | "paused";

interface AudioPlayerState {
    queue: Track[];
    /** Index into `queue` of the ayah playing now, or null when stopped. */
    currentIndex: number | null;
    status: PlaybackStatus;
    /** True while a streamed ayah is still loading or buffering, so the screen can show it. */
    loading: boolean;
    /** How many times each ayah plays before moving on (1 = once). Hifz mode raises this. */
    repeatEach: number;
    /** Silence between repeats, in milliseconds. */
    gapMs: number;
    /** Start the Surah again after its last ayah. */
    loopQueue: boolean;
    /** When the sleep timer will stop playback (epoch ms), or null. */
    sleepAt: number | null;
    /** The option picked for the sleep timer, in minutes (what the picker highlights). */
    sleepChoice: number | null;
    /** The reciter whose sample (Al-Fatihah 1) is playing in the picker, or null. */
    previewReciterId: string | null;
    /** URL of the single word or clip playing now, or null. */
    clipUrl: string | null;
    /** A reciter used just for the current session (hifz practice), instead of the chosen one. */
    reciterOverrideId: string | null;
    /** Repeat and pause used just for the current session (hifz practice); null means use the player's own settings. */
    sessionRepeat: { repeatEach: number; gapMs: number } | null;

    /** Play `queue` from `index`, continuing to the next ayah when each one finishes. */
    playFrom: (queue: Track[], index: number, options?: { reciterId?: string; repeatEach?: number; gapMs?: number }) => void;
    /** Tapping the ayah that is playing stops playback; tapping another ayah plays from there. */
    toggle: (queue: Track[], index: number) => void;
    pause: () => void;
    resume: () => void;
    togglePause: () => void;
    next: () => void;
    previous: () => void;
    stop: () => void;
    /** Called when the current ayah finishes. */
    advance: () => void;
    setRepeatEach: (times: number, gapMs?: number) => void;
    setLoopQueue: (loop: boolean) => void;
    /** Stop playback after this many minutes; null cancels the timer. */
    setSleepTimer: (minutes: number | null) => void;
    /** Play the first ayah with a given reciter without changing the chosen one; again to stop it. */
    togglePreview: (reciterId: string) => void;
    /** Play a short clip such as one word; again to stop it. Replaces any recitation. */
    toggleClip: (url: string) => void;
}

// One player for the whole app, created on first use. State lives in the store and is read with
// get() inside callbacks, so the finish listener never sees an out-of-date queue or index.
let player: AudioPlayer | null = null;
let gapTimer: ReturnType<typeof setTimeout> | null = null;
let sleepTimer: ReturnType<typeof setTimeout> | null = null;
/** How many repeats of the current ayah are still to come. */
let repeatsLeft = 0;
/** True while waiting out the gap between repeats, so resume() knows to replay instead of unpause. */
let replayPending = false;

function clearGap() {
    if (gapTimer) clearTimeout(gapTimer);
    gapTimer = null;
}

function getPlayer(): AudioPlayer {
    if (!player) {
        player = createAudioPlayer(null);
        player.addListener("playbackStatusUpdate", (status) => {
            const store = useAudioPlayerStore.getState();
            // Follow the player's own state, but only while something is meant to be playing.
            const loadingNow = store.status === "playing" && store.loading && (!status.isLoaded || !!status.isBuffering);
            if (store.loading && !loadingNow && status.isLoaded && !status.isBuffering) useAudioPlayerStore.setState({ loading: false });
            if (!status.didJustFinish) return;
            if (store.previewReciterId || store.clipUrl) useAudioPlayerStore.setState({ previewReciterId: null, clipUrl: null });
            else store.advance();
        });
        void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" });
    }
    return player;
}

/** The reciter in use: the session's override (hifz practice) if there is one, else the chosen reciter. */
export function activeReciterId(): string {
    return useAudioPlayerStore.getState().reciterOverrideId ?? useSettingsStore.getState().reciterId;
}

function playTrack(track: Track) {
    const { playbackRate, audioQuality } = useSettingsStore.getState();
    const reciterId = activeReciterId();
    const audio = getPlayer();
    replayPending = false;
    // A downloaded file plays without a connection; anything missing streams as usual.
    const localUri = localAyahUri(reciterId, track.surahNumber, track.ayahNumber);
    useAudioPlayerStore.setState({ loading: localUri === null });
    audio.replace({ uri: localUri ?? ayahAudioUrl(reciterId, track.surahNumber, track.ayahNumber, audioQuality) });
    audio.setPlaybackRate(playbackRate);
    audio.setActiveForLockScreen(true, {
        title: `${track.surahName} · ${track.ayahNumber}`,
        artist: getReciter(reciterId).name,
        albumTitle: "Wird",
    });
    audio.play();
}

/** Repeat and pause in force now: the practice session's if there is one, otherwise the player's own. */
function effectiveRepeat(state: Pick<AudioPlayerState, "repeatEach" | "gapMs" | "sessionRepeat">): { repeatEach: number; gapMs: number } {
    return state.sessionRepeat ?? { repeatEach: state.repeatEach, gapMs: state.gapMs };
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => {
    const startAt = (index: number) => {
        const track = get().queue[index];
        if (!track) return;
        clearGap();
        repeatsLeft = effectiveRepeat(get()).repeatEach - 1;
        set({ currentIndex: index, status: "playing" });
        playTrack(track);
    };

    return {
        queue: [],
        currentIndex: null,
        status: "stopped",
        loading: false,
        repeatEach: 1,
        gapMs: 1500,
        loopQueue: false,
        sleepAt: null,
        sleepChoice: null,
        previewReciterId: null,
        clipUrl: null,
        reciterOverrideId: null,
        sessionRepeat: null,

        playFrom: (queue, index, options) => {
            if (!queue[index]) return;
            const sessionRepeat = options?.repeatEach !== undefined ? { repeatEach: Math.max(1, Math.floor(options.repeatEach)), gapMs: options.gapMs ?? get().gapMs } : null;
            set({ queue, previewReciterId: null, clipUrl: null, reciterOverrideId: options?.reciterId ?? null, sessionRepeat });
            startAt(index);
        },

        toggle: (queue, index) => {
            const { currentIndex, queue: currentQueue, status } = get();
            const current = currentIndex === null ? undefined : currentQueue[currentIndex];
            const tapped = queue[index];
            const isSameAyah = current && tapped && current.surahNumber === tapped.surahNumber && current.ayahNumber === tapped.ayahNumber;
            if (isSameAyah && status !== "stopped") get().stop();
            else get().playFrom(queue, index);
        },

        pause: () => {
            if (get().status !== "playing") return;
            clearGap();
            player?.pause();
            set({ status: "paused", loading: false });
        },

        resume: () => {
            const { status, currentIndex, queue } = get();
            if (status !== "paused" || currentIndex === null) return;
            set({ status: "playing" });
            if (replayPending) playTrack(queue[currentIndex]);
            else player?.play();
        },

        togglePause: () => (get().status === "playing" ? get().pause() : get().resume()),

        next: () => {
            const { currentIndex, queue } = get();
            if (currentIndex === null) return;
            if (currentIndex + 1 < queue.length) startAt(currentIndex + 1);
        },

        previous: () => {
            const { currentIndex } = get();
            if (currentIndex === null) return;
            startAt(Math.max(0, currentIndex - 1));
        },

        togglePreview: (reciterId) => {
            if (get().previewReciterId === reciterId) {
                player?.pause();
                set({ previewReciterId: null });
                return;
            }
            get().stop();
            const audio = getPlayer();
            audio.replace({ uri: ayahAudioUrl(reciterId, 1, 1) });
            audio.setPlaybackRate(1);
            audio.play();
            set({ previewReciterId: reciterId });
        },

        toggleClip: (url) => {
            if (get().clipUrl === url) {
                player?.pause();
                set({ clipUrl: null });
                return;
            }
            get().stop();
            const audio = getPlayer();
            audio.replace({ uri: url });
            audio.setPlaybackRate(1);
            audio.play();
            set({ clipUrl: url });
        },

        stop: () => {
            clearGap();
            replayPending = false;
            repeatsLeft = 0;
            player?.pause();
            player?.clearLockScreenControls();
            set({ queue: [], currentIndex: null, status: "stopped", loading: false, previewReciterId: null, clipUrl: null, reciterOverrideId: null, sessionRepeat: null });
        },

        advance: () => {
            const { queue, currentIndex, loopQueue, status } = get();
            const { gapMs } = effectiveRepeat(get());
            if (currentIndex === null || status !== "playing") return;

            if (repeatsLeft > 0) {
                repeatsLeft -= 1;
                const replay = () => {
                    if (get().status === "playing") playTrack(queue[currentIndex]);
                };
                if (gapMs > 0) {
                    replayPending = true;
                    gapTimer = setTimeout(replay, gapMs);
                } else {
                    replay();
                }
                return;
            }

            if (currentIndex + 1 < queue.length) startAt(currentIndex + 1);
            else if (loopQueue) startAt(0);
            else get().stop();
        },

        // Choosing a repeat in the player's own options ends any practice session's repeat, so what you pick is what you get.
        setRepeatEach: (times, gapMs) => set((state) => ({ repeatEach: Math.max(1, Math.floor(times)), gapMs: gapMs ?? state.gapMs, sessionRepeat: null })),

        setLoopQueue: (loopQueue) => set({ loopQueue }),

        setSleepTimer: (minutes) => {
            if (sleepTimer) clearTimeout(sleepTimer);
            sleepTimer = null;
            if (minutes === null) {
                set({ sleepAt: null, sleepChoice: null });
                return;
            }
            set({ sleepAt: Date.now() + minutes * 60_000, sleepChoice: minutes });
            sleepTimer = setTimeout(() => {
                sleepTimer = null;
                get().stop();
                set({ sleepAt: null, sleepChoice: null });
            }, minutes * 60_000);
        },
    };
});

// Changing the reciter or speed in Settings (or the picker) applies to what is playing right now:
// the current ayah restarts with the new reciter, so the listener keeps their place.
useSettingsStore.subscribe((state, previous) => {
    const { status, currentIndex, queue } = useAudioPlayerStore.getState();
    if (status === "stopped" || currentIndex === null) return;
    if (state.playbackRate !== previous.playbackRate) player?.setPlaybackRate(state.playbackRate);
    // A session reciter (hifz practice) is not changed by the Settings choice.
    if (state.reciterId !== previous.reciterId && !useAudioPlayerStore.getState().reciterOverrideId) {
        const wasPaused = status === "paused";
        playTrack(queue[currentIndex]);
        if (wasPaused) {
            player?.pause();
            replayPending = false;
        }
    }
});

/** The ayah playing now, if it belongs to the given Surah. */
export function usePlayingAyah(surahNumber: number): number | null {
    return useAudioPlayerStore((state) => {
        const track = state.currentIndex === null ? undefined : state.queue[state.currentIndex];
        return track && track.surahNumber === surahNumber ? track.ayahNumber : null;
    });
}

/** True while the ayah that should be playing is still loading or buffering. */
export function useIsLoading(): boolean {
    return useAudioPlayerStore((state) => state.status === "playing" && state.loading);
}

/** The track at the current position, or null when stopped. */
export function useCurrentTrack(): Track | null {
    return useAudioPlayerStore((state) => (state.currentIndex === null ? null : (state.queue[state.currentIndex] ?? null)));
}

/** For tests: forget the shared player and timers so each test starts fresh. */
export function resetAudioPlayerForTests() {
    clearGap();
    if (sleepTimer) clearTimeout(sleepTimer);
    sleepTimer = null;
    player = null;
    repeatsLeft = 0;
    replayPending = false;
    useAudioPlayerStore.setState({ queue: [], currentIndex: null, status: "stopped", loading: false, repeatEach: 1, gapMs: 1500, loopQueue: false, sleepAt: null, sleepChoice: null, previewReciterId: null, clipUrl: null, reciterOverrideId: null, sessionRepeat: null });
}

/** The reciter heard right now (and shown in the mini-player). */
export function useActiveReciterId(): string {
    const override = useAudioPlayerStore((state) => state.reciterOverrideId);
    const chosen = useSettingsStore((state) => state.reciterId);
    return override ?? chosen;
}

/** The repeat count shown in the player options: the session's while practising, otherwise the player's own. */
export function useEffectiveRepeatEach(): number {
    return useAudioPlayerStore((state) => state.sessionRepeat?.repeatEach ?? state.repeatEach);
}
