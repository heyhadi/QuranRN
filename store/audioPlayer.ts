import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { create } from "zustand";

export interface Track {
    surahNumber: number;
    ayahNumber: number;
    url: string;
}

interface AudioPlayerState {
    queue: Track[];
    /** Index into `queue` of the ayah playing now, or null when stopped. */
    currentIndex: number | null;
    /** Play `queue` from `index`, continuing to the next ayah when each one finishes. */
    playFrom: (queue: Track[], index: number) => void;
    /** Tapping the ayah that is playing stops playback; tapping another ayah plays from there. */
    toggle: (queue: Track[], index: number) => void;
    stop: () => void;
    /** Called when the current ayah finishes. */
    advance: () => void;
}

// One player for the whole app, created on first use. State lives in the store and is read with
// get() inside callbacks, so the finish listener never sees an out-of-date queue or index.
let player: AudioPlayer | null = null;

function getPlayer(): AudioPlayer {
    if (!player) {
        player = createAudioPlayer(null);
        player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) useAudioPlayerStore.getState().advance();
        });
        void setAudioModeAsync({ playsInSilentMode: true });
    }
    return player;
}

function playTrack(track: Track) {
    const audio = getPlayer();
    audio.replace({ uri: track.url });
    audio.play();
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => ({
    queue: [],
    currentIndex: null,

    playFrom: (queue, index) => {
        const track = queue[index];
        if (!track) return;
        set({ queue, currentIndex: index });
        playTrack(track);
    },

    toggle: (queue, index) => {
        const { currentIndex, queue: currentQueue } = get();
        const current = currentIndex === null ? undefined : currentQueue[currentIndex];
        const tapped = queue[index];
        if (current && tapped && current.surahNumber === tapped.surahNumber && current.ayahNumber === tapped.ayahNumber) {
            get().stop();
        } else {
            get().playFrom(queue, index);
        }
    },

    stop: () => {
        player?.pause();
        set({ queue: [], currentIndex: null });
    },

    advance: () => {
        const { queue, currentIndex } = get();
        if (currentIndex === null) return;
        const next = currentIndex + 1;
        if (next < queue.length) {
            set({ currentIndex: next });
            playTrack(queue[next]);
        } else {
            get().stop();
        }
    },
}));

/** The ayah playing now, if it belongs to the given Surah. */
export function usePlayingAyah(surahNumber: number): number | null {
    return useAudioPlayerStore((state) => {
        const track = state.currentIndex === null ? undefined : state.queue[state.currentIndex];
        return track && track.surahNumber === surahNumber ? track.ayahNumber : null;
    });
}

/** For tests: forget the shared player so each test starts fresh. */
export function resetAudioPlayerForTests() {
    player = null;
    useAudioPlayerStore.setState({ queue: [], currentIndex: null });
}
