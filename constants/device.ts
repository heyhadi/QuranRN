import { Dimensions } from "react-native";

/** A phone's short side is under 600 points; tablets (and the iPad mini) are above it. */
export function isPhone(width: number, height: number): boolean {
    return Math.min(width, height) < 600;
}

/**
 * The app allows every orientation so tablets can turn; phones stay upright. The native module is loaded
 * here, not at the top of the file, so a build that does not have it (an older dev client) just stays as it is.
 */
export async function lockPhoneToPortrait(): Promise<void> {
    const { width, height } = Dimensions.get("window");
    if (!isPhone(width, height)) return;
    try {
        const ScreenOrientation = await import("expo-screen-orientation");
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch {
        // No native support in this build: leave the orientation alone.
    }
}
