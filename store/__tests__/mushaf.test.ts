import { useMushafStore } from "../mushaf";

beforeEach(() => useMushafStore.setState({ page: null }));

describe("mushaf store", () => {
    it("remembers the page", () => {
        useMushafStore.getState().setPage(50);
        expect(useMushafStore.getState().page).toBe(50);
    });

    it("ignores pages outside the mushaf", () => {
        useMushafStore.getState().setPage(50);
        useMushafStore.getState().setPage(0);
        useMushafStore.getState().setPage(605);
        useMushafStore.getState().setPage(2.5);
        expect(useMushafStore.getState().page).toBe(50);
    });
});
