import { getJson, HttpError } from "../http";

const originalFetch = global.fetch;

afterEach(() => {
    global.fetch = originalFetch;
});

describe("getJson", () => {
    it("returns the parsed body on success", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ hello: "world" }) });

        await expect(getJson("https://example.test/ok")).resolves.toEqual({ hello: "world" });
    });

    it("throws an HttpError with the status for non-2xx responses", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

        await expect(getJson("https://example.test/missing")).rejects.toMatchObject({ name: "HttpError", status: 404 });
    });

    it("wraps network failures in an HttpError", async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"));

        await expect(getJson("https://example.test/offline")).rejects.toBeInstanceOf(HttpError);
    });
});
