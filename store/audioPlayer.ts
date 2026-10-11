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

    /** Play `queue` from `index`, continuing to the next ayah when each one finishes. */
    playFrom: (queue: Track[], index: number) => void;
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
            if (!status.didJustFinish) return;
            const store = useAudioPlayerStore.getState();
            if (store.previewReciterId || store.clipUrl) useAudioPlayerStore.setState({ previewReciterId: null, clipUrl: null });
            else store.advance();
        });
        void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" });
    }
    return player;
}

function playTrack(track: Track) {
    const { reciterId, playbackRate } = useSettingsStore.getState();
    const audio = getPlayer();
    replayPending = false;
    // A downloaded file plays without a connection; anything missing streams as usual.
    audio.replace({ uri: localAyahUri(reciterId, track.surahNumber, track.ayahNumber) ?? ayahAudioUrl(reciterId, track.surahNumber, track.ayahNumber) });
    audio.setPlaybackRate(playbackRate);
    audio.setActiveForLockScreen(true, {
        title: `${track.surahName} · ${track.ayahNumber}`,
        artist: getReciter(reciterId).name,
        albumTitle: "Wird",
    });
    audio.play();
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => {
    const startAt = (index: number) => {
        const track = get().queue[index];
        if (!track) return;
        clearGap();
        repeatsLeft = get().repeatEach - 1;
        set({ currentIndex: index, status: "playing" });
        playTrack(track);
    };

    return {
        queue: [],
        currentIndex: null,
        status: "stopped",
        repeatEach: 1,
        gapMs: 1500,
        loopQueue: false,
        sleepAt: null,
        sleepChoice: null,
        previewReciterId: null,
        clipUrl: null,

        playFrom: (queue, index) => {
            if (!queue[index]) return;
            set({ queue, previewReciterId: null, clipUrl: null });
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
            set({ status: "paused" });
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
            set({ queue: [], currentIndex: null, status: "stopped", previewReciterId: null, clipUrl: null });
        },

        advance: () => {
            const { queue, currentIndex, gapMs, loopQueue, status } = get();
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

        setRepeatEach: (times, gapMs) => set((state) => ({ repeatEach: Math.max(1, Math.floor(times)), gapMs: gapMs ?? state.gapMs })),

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
    if (state.reciterId !== previous.reciterId) {
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
    useAudioPlayerStore.setState({ queue: [], currentIndex: null, status: "stopped", repeatEach: 1, gapMs: 1500, loopQueue: false, sleepAt: null, sleepChoice: null, previewReciterId: null, clipUrl: null });
}
