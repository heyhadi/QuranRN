import { resetAudioPlayerForTests, useAudioPlayerStore, type Track } from "../audioPlayer";
import { useSettingsStore } from "../settings";

// A fake expo-audio player that records what it was asked to do and lets the test finish a track.
const mockPlayer = {
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    setPlaybackRate: jest.fn(),
    setActiveForLockScreen: jest.fn(),
    clearLockScreenControls: jest.fn(),
    listener: null as null | ((status: { didJustFinish: boolean; isLoaded?: boolean; isBuffering?: boolean }) => void),
    addListener(_event: string, listener: (status: { didJustFinish: boolean; isLoaded?: boolean; isBuffering?: boolean }) => void) {
        this.listener = listener;
    },
};

const mockCachedUri = jest.fn((..._args: unknown[]): string | null => null);
const mockPrefetch = jest.fn((..._args: unknown[]): Promise<void> => Promise.resolve());
jest.mock("@/services/audioCache", () => ({ cachedAudioUri: (...args: unknown[]) => mockCachedUri(...args), prefetchAudio: (...args: unknown[]) => mockPrefetch(...args) }));

const mockLocalUri = jest.fn((..._args: unknown[]): string | null => null);
jest.mock("@/services/audioDownloads", () => ({ localAyahUri: (...args: unknown[]) => mockLocalUri(...args) }));

jest.mock("expo-audio", () => ({
    createAudioPlayer: () => mockPlayer,
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

const queue: Track[] = [1, 2, 3].map((ayahNumber) => ({ surahNumber: 112, ayahNumber, surahName: "Al-Ikhlas" }));
const finishCurrentAyah = () => mockPlayer.listener?.({ didJustFinish: true });
const playingUrl = () => mockPlayer.replace.mock.calls.at(-1)?.[0]?.uri as string | undefined;
const state = () => useAudioPlayerStore.getState();
const currentAyah = () => (state().currentIndex === null ? null : state().queue[state().currentIndex!].ayahNumber);

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockLocalUri.mockReturnValue(null);
    mockCachedUri.mockReturnValue(null);
    mockPrefetch.mockResolvedValue(undefined);
    mockPlayer.listener = null;
    resetAudioPlayerForTests();
    useSettingsStore.setState({ reciterId: "alafasy", playbackRate: 1 });
});

describe("playing", () => {
    it("plays the tapped ayah with the chosen reciter", () => {
        state().playFrom(queue, 1);

        expect(playingUrl()).toBe("https://everyayah.com/data/Alafasy_128kbps/112002.mp3");
        expect(mockPlayer.play).toHaveBeenCalled();
        expect(currentAyah()).toBe(2);
        expect(state().status).toBe("playing");
    });

    it("shows the ayah on the lock screen", () => {
        state().playFrom(queue, 0);

        expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(true, expect.objectContaining({ title: "Al-Ikhlas · 1", artist: "Mishary Rashid Alafasy" }));
    });

    it("moves on to the next ayah when one finishes", () => {
        state().playFrom(queue, 0);

        finishCurrentAyah();

        expect(currentAyah()).toBe(2);
        expect(playingUrl()).toMatch(/112002\.mp3$/);
    });

    it("stops after the last ayah", () => {
        state().playFrom(queue, 2);

        finishCurrentAyah();

        expect(currentAyah()).toBeNull();
        expect(state().status).toBe("stopped");
        expect(mockPlayer.clearLockScreenControls).toHaveBeenCalled();
    });

    it("stops when the playing ayah is tapped again, and switches when another is tapped", () => {
        state().toggle(queue, 0);
        state().toggle(queue, 2);
        expect(currentAyah()).toBe(3);

        state().toggle(queue, 2);
        expect(currentAyah()).toBeNull();
    });

    it("ignores a finish event after playback was stopped", () => {
        state().playFrom(queue, 0);
        state().stop();
        mockPlayer.replace.mockClear();

        finishCurrentAyah();

        expect(mockPlayer.replace).not.toHaveBeenCalled();
    });
});

describe("pause, next and previous", () => {
    it("pauses and resumes without restarting the ayah", () => {
        state().playFrom(queue, 0);
        mockPlayer.replace.mockClear();

        state().pause();
        expect(state().status).toBe("paused");
        expect(mockPlayer.pause).toHaveBeenCalled();

        state().resume();
        expect(state().status).toBe("playing");
        expect(mockPlayer.replace).not.toHaveBeenCalled();
    });

    it("skips to the next and previous ayah, staying inside the queue", () => {
        state().playFrom(queue, 1);

        state().next();
        expect(currentAyah()).toBe(3);
        state().next();
        expect(currentAyah()).toBe(3);

        state().previous();
        expect(currentAyah()).toBe(2);
        state().previous();
        state().previous();
        expect(currentAyah()).toBe(1);
    });
});

describe("repeat and loop", () => {
    it("repeats each ayah the chosen number of times before moving on", () => {
        state().setRepeatEach(3, 0);
        state().playFrom(queue, 0);

        finishCurrentAyah();
        finishCurrentAyah();
        expect(currentAyah()).toBe(1);
        expect(mockPlayer.replace).toHaveBeenCalledTimes(3);

        finishCurrentAyah();
        expect(currentAyah()).toBe(2);
    });

    it("waits out the gap between repeats", () => {
        jest.useFakeTimers();
        state().setRepeatEach(2, 2000);
        state().playFrom(queue, 0);

        finishCurrentAyah();
        expect(mockPlayer.replace).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(2000);
        expect(mockPlayer.replace).toHaveBeenCalledTimes(2);
    });

    it("loops back to the first ayah when asked to", () => {
        state().setLoopQueue(true);
        state().playFrom(queue, 2);

        finishCurrentAyah();

        expect(currentAyah()).toBe(1);
    });
});

describe("settings that apply while playing", () => {
    it("restarts the current ayah with the new reciter, keeping the place", () => {
        state().playFrom(queue, 1);

        useSettingsStore.getState().setReciterId("husary");

        expect(currentAyah()).toBe(2);
        expect(playingUrl()).toBe("https://everyayah.com/data/Husary_128kbps/112002.mp3");
    });

    it("applies a new playback speed immediately", () => {
        state().playFrom(queue, 0);

        useSettingsStore.getState().setPlaybackRate(1.5);

        expect(mockPlayer.setPlaybackRate).toHaveBeenLastCalledWith(1.5);
    });
});

describe("sleep timer", () => {
    it("stops playback when the time is up", () => {
        jest.useFakeTimers();
        state().playFrom(queue, 0);

        state().setSleepTimer(10);
        expect(state().sleepAt).not.toBeNull();

        jest.advanceTimersByTime(10 * 60_000);
        expect(state().status).toBe("stopped");
        expect(state().sleepAt).toBeNull();
    });

    it("can be cancelled", () => {
        jest.useFakeTimers();
        state().playFrom(queue, 0);
        state().setSleepTimer(10);

        state().setSleepTimer(null);
        jest.advanceTimersByTime(10 * 60_000);

        expect(state().status).toBe("playing");
    });
});

describe("reciter preview", () => {
    it("plays Al-Fatihah 1 with the previewed reciter without changing the chosen one", () => {
        state().togglePreview("husary");

        expect(playingUrl()).toBe("https://everyayah.com/data/Husary_128kbps/001001.mp3");
        expect(state().previewReciterId).toBe("husary");
        expect(useSettingsStore.getState().reciterId).toBe("alafasy");
    });

    it("stops the preview when tapped again and when it finishes", () => {
        state().togglePreview("husary");
        state().togglePreview("husary");
        expect(state().previewReciterId).toBeNull();

        state().togglePreview("rifai");
        finishCurrentAyah();
        expect(state().previewReciterId).toBeNull();
    });

    it("replaces a running recitation", () => {
        state().playFrom(queue, 0);

        state().togglePreview("husary");

        expect(state().status).toBe("stopped");
    });
});

describe("downloaded audio", () => {
    it("plays the local file when the ayah was downloaded", () => {
        mockLocalUri.mockReturnValue("file:///docs/audio/alafasy/112/001.mp3");

        state().playFrom(queue, 0);

        expect(playingUrl()).toBe("file:///docs/audio/alafasy/112/001.mp3");
        expect(mockLocalUri).toHaveBeenCalledWith("alafasy", 112, 1);
    });

    it("streams when there is no local file", () => {
        state().playFrom(queue, 0);

        expect(playingUrl()).toMatch(/^https:\/\/everyayah\.com/);
    });
});

describe("word clips", () => {
    it("plays a clip and stops it when tapped again", () => {
        state().toggleClip("https://verses.quran.com/wbw/112_001_001.mp3");
        expect(playingUrl()).toBe("https://verses.quran.com/wbw/112_001_001.mp3");
        expect(state().clipUrl).not.toBeNull();

        state().toggleClip("https://verses.quran.com/wbw/112_001_001.mp3");
        expect(state().clipUrl).toBeNull();
    });

    it("clears when the clip finishes, and replaces a running recitation", () => {
        state().playFrom(queue, 0);
        state().toggleClip("https://verses.quran.com/wbw/112_001_002.mp3");
        expect(state().status).toBe("stopped");

        finishCurrentAyah();
        expect(state().clipUrl).toBeNull();
    });
});

describe("session reciter (hifz practice)", () => {
    it("plays with the override instead of the chosen reciter", () => {
        state().playFrom(queue, 0, { reciterId: "husary-muallim" });

        expect(playingUrl()).toBe("https://everyayah.com/data/Husary_Muallim_128kbps/112001.mp3");
        expect(state().reciterOverrideId).toBe("husary-muallim");
    });

    it("keeps the override across ayahs and drops it when playback stops", () => {
        state().playFrom(queue, 0, { reciterId: "husary-muallim" });
        finishCurrentAyah();
        expect(playingUrl()).toMatch(/Husary_Muallim_128kbps\/112002\.mp3$/);

        state().stop();
        expect(state().reciterOverrideId).toBeNull();
    });

    it("is not changed by a different reciter chosen in Settings meanwhile", () => {
        state().playFrom(queue, 0, { reciterId: "husary-muallim" });
        mockPlayer.replace.mockClear();

        useSettingsStore.getState().setReciterId("rifai");

        expect(mockPlayer.replace).not.toHaveBeenCalled();
    });
});

describe("hifz practice does not leak into normal listening", () => {
    it("repeats only during the practice session", () => {
        state().playFrom(queue, 0, { reciterId: "husary-muallim", repeatEach: 3, gapMs: 0 });
        finishCurrentAyah();
        finishCurrentAyah();
        expect(currentAyah()).toBe(1);
        finishCurrentAyah();
        expect(currentAyah()).toBe(2);
    });

    it("plays each ayah once again when a normal session starts afterwards", () => {
        state().playFrom(queue, 0, { repeatEach: 3, gapMs: 0 });
        state().stop();

        state().playFrom(queue, 0);
        finishCurrentAyah();

        expect(currentAyah()).toBe(2);
        expect(state().sessionRepeat).toBeNull();
    });

    it("also resets when a normal session starts without stopping the practice first", () => {
        state().playFrom(queue, 0, { repeatEach: 5, gapMs: 0 });

        state().playFrom(queue, 0);
        finishCurrentAyah();

        expect(currentAyah()).toBe(2);
    });

    it("keeps the player's own repeat choice, untouched by practice", () => {
        state().setRepeatEach(2, 0);
        state().playFrom(queue, 0, { repeatEach: 5, gapMs: 0 });
        state().stop();

        state().playFrom(queue, 0);
        finishCurrentAyah();
        expect(currentAyah()).toBe(1);
        finishCurrentAyah();
        expect(currentAyah()).toBe(2);
    });

    it("lets the player's own repeat choice replace a practice session's", () => {
        state().playFrom(queue, 0, { repeatEach: 5, gapMs: 0 });

        state().setRepeatEach(1, 0);

        expect(state().sessionRepeat).toBeNull();
    });
});

describe("loading", () => {
    const report = (status: { isLoaded: boolean; isBuffering?: boolean }) => mockPlayer.listener?.({ didJustFinish: false, ...status });

    it("is loading while a streamed ayah starts, and clears once the player has it", () => {
        state().playFrom(queue, 0);
        expect(state().loading).toBe(true);

        report({ isLoaded: false });
        expect(state().loading).toBe(true);
        report({ isLoaded: true, isBuffering: true });
        expect(state().loading).toBe(true);
        report({ isLoaded: true, isBuffering: false });
        expect(state().loading).toBe(false);
    });

    it("is not loading for a downloaded ayah", () => {
        mockLocalUri.mockReturnValue("file:///audio/112001.mp3");
        state().playFrom(queue, 0);

        expect(state().loading).toBe(false);
    });

    it("clears when paused or stopped", () => {
        state().playFrom(queue, 0);
        state().pause();
        expect(state().loading).toBe(false);

        state().resume();
        state().playFrom(queue, 1);
        expect(state().loading).toBe(true);
        state().stop();
        expect(state().loading).toBe(false);
    });
});

describe("audio cache", () => {
    const urlFor = (ayah: number) => `https://everyayah.com/data/Alafasy_128kbps/112${String(ayah).padStart(3, "0")}.mp3`;
    const prefetched = () => mockPrefetch.mock.calls.map((call) => call[0]);

    it("fetches the next two ayahs while one plays", () => {
        state().playFrom(queue, 0);

        expect(prefetched()).toEqual([urlFor(2), urlFor(3)]);
    });

    it("fetches only what is left near the end of the queue", () => {
        state().playFrom(queue, 2);

        expect(prefetched()).toEqual([]);
    });

    it("also fetches the current ayah when it will repeat", () => {
        state().setRepeatEach(3);
        state().playFrom(queue, 0);

        expect(prefetched()).toEqual([urlFor(1), urlFor(2), urlFor(3)]);
    });

    it("skips ayahs that are downloaded or already cached", () => {
        mockLocalUri.mockImplementation((...args) => (args[2] === 2 ? "file:///audio/112002.mp3" : null));
        mockCachedUri.mockImplementation((url) => (url === urlFor(3) ? "file:///cache/112003.mp3" : null));
        state().playFrom(queue, 0);

        expect(prefetched()).toEqual([]);
    });

    it("plays a cached copy instead of streaming, with no loading spinner", () => {
        mockCachedUri.mockImplementation((url) => (url === urlFor(1) ? "file:///cache/112001.mp3" : null));
        state().playFrom(queue, 0);

        expect(playingUrl()).toBe("file:///cache/112001.mp3");
        expect(state().loading).toBe(false);
    });

    it("prefers a downloaded Surah over a cached copy", () => {
        mockLocalUri.mockReturnValue("file:///audio/112001.mp3");
        mockCachedUri.mockReturnValue("file:///cache/112001.mp3");
        state().playFrom(queue, 0);

        expect(playingUrl()).toBe("file:///audio/112001.mp3");
    });

    it("keeps playing when a background fetch fails", async () => {
        mockPrefetch.mockRejectedValue(new Error("offline"));
        state().playFrom(queue, 0);
        await Promise.resolve();

        expect(state().status).toBe("playing");
    });
});
