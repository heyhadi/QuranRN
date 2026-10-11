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
    listener: null as null | ((status: { didJustFinish: boolean }) => void),
    addListener(_event: string, listener: (status: { didJustFinish: boolean }) => void) {
        this.listener = listener;
    },
};

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
