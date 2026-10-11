/** "1.0.0 (87defc1)" for an EAS build, "1.0.0 (dev)" when run from a dev server. */
export function versionLabel(version: string | undefined, build: unknown): string {
    const short = typeof build === "string" && build.length > 0 ? build : "dev";
    return `${version ?? "1.0.0"} (${short})`;
}
