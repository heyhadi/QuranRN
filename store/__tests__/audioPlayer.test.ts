import { resetAudioPlayerForTests, useAudioPlayerStore, type Track } from "../audioPlayer";

// A fake expo-audio player that records what it was asked to play and lets the test finish a track.
const mockPlayer = {
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    listener: null as null | ((status: { didJustFinish: boolean }) => void),
    addListener(_event: string, listener: (status: { didJustFinish: boolean }) => void) {
        this.listener = listener;
    },
};

jest.mock("expo-audio", () => ({
    createAudioPlayer: () => mockPlayer,
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

const queue: Track[] = [1, 2, 3].map((ayahNumber) => ({ surahNumber: 112, ayahNumber, url: `https://audio.test/112${ayahNumber}.mp3` }));
const finishCurrentAyah = () => mockPlayer.listener?.({ didJustFinish: true });
const playingUrl = () => mockPlayer.replace.mock.calls.at(-1)?.[0]?.uri;
const currentAyah = () => {
    const { queue: q, currentIndex } = useAudioPlayerStore.getState();
    return currentIndex === null ? null : q[currentIndex].ayahNumber;
};

beforeEach(() => {
    jest.clearAllMocks();
    mockPlayer.listener = null;
    resetAudioPlayerForTests();
});

describe("audio player store", () => {
    it("plays the tapped ayah", () => {
        useAudioPlayerStore.getState().playFrom(queue, 1);

        expect(playingUrl()).toBe("https://audio.test/1122.mp3");
        expect(mockPlayer.play).toHaveBeenCalled();
        expect(currentAyah()).toBe(2);
    });

    it("moves on to the next ayah when one finishes", () => {
        useAudioPlayerStore.getState().playFrom(queue, 0);

        finishCurrentAyah();

        expect(currentAyah()).toBe(2);
        expect(playingUrl()).toBe("https://audio.test/1122.mp3");
    });

    it("stops after the last ayah", () => {
        useAudioPlayerStore.getState().playFrom(queue, 2);

        finishCurrentAyah();

        expect(currentAyah()).toBeNull();
        expect(mockPlayer.pause).toHaveBeenCalled();
    });

    it("stops when the playing ayah is tapped again", () => {
        const { toggle } = useAudioPlayerStore.getState();
        toggle(queue, 0);

        toggle(queue, 0);

        expect(currentAyah()).toBeNull();
    });

    it("switches to another ayah when a different one is tapped", () => {
        const { toggle } = useAudioPlayerStore.getState();
        toggle(queue, 0);

        toggle(queue, 2);

        expect(currentAyah()).toBe(3);
        expect(playingUrl()).toBe("https://audio.test/1123.mp3");
    });

    it("ignores a finish event after playback was stopped", () => {
        useAudioPlayerStore.getState().playFrom(queue, 0);
        useAudioPlayerStore.getState().stop();
        mockPlayer.replace.mockClear();

        finishCurrentAyah();

        expect(currentAyah()).toBeNull();
        expect(mockPlayer.replace).not.toHaveBeenCalled();
    });
});
