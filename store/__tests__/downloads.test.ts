import { downloadKey, useDownloadsStore } from "../downloads";
import { storage } from "../storage";

const mockDownload = jest.fn();
const mockDelete = jest.fn();
jest.mock("@/services/audioDownloads", () => ({
    downloadSurahAudio: (...args: unknown[]) => mockDownload(...args),
    deleteSurahAudio: (...args: unknown[]) => mockDelete(...args),
}));

const state = () => useDownloadsStore.getState();

beforeEach(() => {
    jest.clearAllMocks();
    storage.clearAll();
    useDownloadsStore.setState({ completed: {}, active: {} });
});

describe("downloads store", () => {
    it("tracks progress and marks the Surah as downloaded when done", async () => {
        mockDownload.mockImplementation(async ({ onProgress }: { onProgress: (done: number) => void }) => {
            onProgress(1);
            expect(state().active[downloadKey("alafasy", 112)]).toEqual({ done: 1, total: 4, failed: false });
            onProgress(4);
        });

        await state().download("alafasy", 112, 4);

        expect(state().completed[downloadKey("alafasy", 112)]).toBe(true);
        expect(state().active).toEqual({});
    });

    it("keeps a failed download visible so the user can retry, and does not mark it done", async () => {
        mockDownload.mockRejectedValue(new Error("offline"));

        await state().download("alafasy", 112, 4);

        expect(state().completed).toEqual({});
        expect(state().active[downloadKey("alafasy", 112)]?.failed).toBe(true);
    });

    it("does not start a second download of the same Surah", async () => {
        let release!: () => void;
        mockDownload.mockImplementation(() => new Promise<void>((resolve) => (release = resolve)));

        const first = state().download("alafasy", 112, 4);
        await state().download("alafasy", 112, 4);
        release();
        await first;

        expect(mockDownload).toHaveBeenCalledTimes(1);
    });

    it("does not mark a cancelled download as complete", async () => {
        mockDownload.mockImplementation(async ({ shouldCancel }: { shouldCancel: () => boolean }) => {
            state().cancel("alafasy", 112);
            expect(shouldCancel()).toBe(true);
        });

        await state().download("alafasy", 112, 4);

        expect(state().completed).toEqual({});
        expect(state().active).toEqual({});
    });

    it("removes the files and the record", async () => {
        useDownloadsStore.setState({ completed: { [downloadKey("alafasy", 112)]: true } });

        state().remove("alafasy", 112);

        expect(mockDelete).toHaveBeenCalledWith("alafasy", 112);
        expect(state().completed).toEqual({});
    });

    it("saves only completed downloads, not running ones", async () => {
        useDownloadsStore.setState({ completed: { [downloadKey("husary", 1)]: true }, active: { x: { done: 1, total: 2, failed: false } } });

        const saved = JSON.parse(storage.getString("downloads") ?? "{}");
        expect(saved.state).toEqual({ completed: { "husary:1": true } });
    });
});
