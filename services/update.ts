/**
 * In-app updates from the repo's GitHub Releases (the app isn't on the
 * Play Store). Kotlin: UpdateModule.kt — verifies the download (same app,
 * newer, same signing key) before Android's installer opens.
 */
import { NativeEventEmitter, NativeModules, Platform } from "react-native";

const RELEASES_API = "https://api.github.com/repos/heyhadi/wird/releases/latest";
const MODULE_NAME = "UpdateModule";

interface UpdateModuleSpec {
    getInstalledBuild(): Promise<number>;
    downloadAndInstall(url: string): Promise<void>;
}

function spec(): UpdateModuleSpec | null {
    if (Platform.OS !== "android") return null;
    return (NativeModules[MODULE_NAME] as UpdateModuleSpec | undefined) ?? null;
}

export interface AvailableUpdate {
    /** Release title, e.g. "v2.4.0". */
    title: string;
    /** Direct APK download URL. */
    apkUrl: string;
}

/**
 * A newer CI build, or null. Local builds (versionCode 1) never match a CI
 * build's signing key, so they don't offer updates they couldn't install.
 */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
    const module = spec();
    if (!module) return null;
    const installed = await module.getInstalledBuild();
    if (installed <= 1) return null;
    const response = await fetch(RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return null;
    const release = await response.json();
    const apk = (release.assets as Array<{ name: string; browser_download_url: string }> | undefined)?.find(
        (a) => a.name.endsWith(".apk")
    );
    if (!apk) return null;
    // Release tag is like "v2.4.0-62" where 62 is the versionCode.
    const match = /-(\d+)$/.exec(release.tag_name as string);
    const latest = match ? parseInt(match[1], 10) : 0;
    if (latest <= installed) return null;
    return { title: release.name ?? release.tag_name, apkUrl: apk.browser_download_url };
}

/**
 * Download and hand the APK to Android's installer (the user confirms).
 * Rejects with code NEEDS_INSTALL_PERMISSION after opening the one-time
 * "Install unknown apps" setting.
 */
export async function installUpdate(update: AvailableUpdate): Promise<void> {
    const module = spec();
    if (!module) throw new Error("Update module not available");
    await module.downloadAndInstall(update.apkUrl);
}

export interface DownloadProgress {
    /** Bytes downloaded so far. */
    downloaded: number;
    /** Total bytes, or -1 when the server didn't send a length. */
    total: number;
}

/**
 * Subscribe to `onDownloadProgress` while an update downloads.
 * Events are throttled natively (~every 256 KB).
 */
export function addDownloadProgressListener(
    listener: (progress: DownloadProgress) => void
): () => void {
    const module = spec();
    if (!module) return () => {};
    const emitter = new NativeEventEmitter(NativeModules[MODULE_NAME]);
    const sub = emitter.addListener("onDownloadProgress", listener);
    return () => sub.remove();
}
