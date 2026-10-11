import { FEEDBACK_EMAIL, issueUrl, mailUrl, REPO_URL } from "../links";

const context = { version: "1.2.0", platform: "android", osVersion: "15", language: "id" };

describe("issueUrl", () => {
    it("opens a new issue on the repo with the bug label and the app details", () => {
        const url = new URL(issueUrl("bug", context));
        expect(`${url.origin}${url.pathname}`).toBe(`${REPO_URL}/issues/new`);
        expect(url.searchParams.get("labels")).toBe("bug");
        expect(url.searchParams.get("title")).toBe("Problem: ");
        expect(url.searchParams.get("body")).toContain("What happened");
        expect(url.searchParams.get("body")).toContain("App: Wird 1.2.0\nPlatform: android 15\nLanguage: id");
    });

    it("uses the enhancement label for ideas", () => {
        const url = new URL(issueUrl("feature", context));
        expect(url.searchParams.get("labels")).toBe("enhancement");
        expect(url.searchParams.get("body")).toContain("The idea");
    });
});

describe("mailUrl", () => {
    it("writes to the feedback address with the app details and encoded spaces", () => {
        const url = mailUrl(context);
        expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
        expect(url).not.toContain("+");
        const query = new URLSearchParams(url.split("?")[1].replace(/%20/g, "%20"));
        expect(query.get("subject")).toBe("Wird feedback");
        expect(query.get("body")).toContain("App: Wird 1.2.0\nPlatform: android 15\nLanguage: id");
    });
});
