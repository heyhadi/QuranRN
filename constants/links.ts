export const REPO_URL = "https://github.com/heyhadi/wird";

export interface FeedbackContext {
    version: string;
    platform: string;
    osVersion: string;
    language: string;
}

/**
 * A GitHub new-issue link with the template filled in. Only the app version, platform, OS version and
 * language go in: nothing that identifies the person or what they have read or saved.
 */
export function issueUrl(kind: "bug" | "feature", context: FeedbackContext): string {
    const details = `App: Wird ${context.version}\nPlatform: ${context.platform} ${context.osVersion}\nLanguage: ${context.language}`;
    const body = kind === "bug" ? `**What happened**\n\n\n**What you expected**\n\n\n**Steps to repeat it**\n\n\n---\n${details}\n` : `**The idea**\n\n\n**Why it would help**\n\n\n---\n${details}\n`;
    const params = new URLSearchParams({ title: kind === "bug" ? "Problem: " : "Idea: ", body, labels: kind === "bug" ? "bug" : "enhancement" });
    return `${REPO_URL}/issues/new?${params.toString()}`;
}
