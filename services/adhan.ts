import { Asset } from "expo-asset";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { usePrayerStore } from "@/store/prayer";

// Plays the adhan when a prayer-time notification arrives.
//
// How the adhan reaches the user depends on the platform:
// - Android: the "wird-adhan" notification channel carries the sound itself
//   (see services/notifications.ts), so the system plays it even when the app
//   is killed. This player is not used there.
// - iOS: a bundled notification sound is capped at 30 seconds, so when the app
//   is open the full adhan is played here instead. Tapping the notification
//   stops it (see setupAdhanPlayback in services/notifications.ts).
//
// Audio: assets/audio/adhan.mp3, downloaded from islamcan.com/audio/adhan/
// (azan3.mp3) — free download, credited in README.md.

/** Metro turns require() of a bundled file into a numeric module id. */
const adhanModuleId = require("@/assets/audio/adhan.mp3") as number;

let player: AudioPlayer | null = null;
/** True while an adhan started by playAdhan() is still playing. */
let playing = false;

function getPlayer(): AudioPlayer {
    if (!player) {
        player = createAudioPlayer(null);
        player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) playing = false;
        });
        // Same mode as the Quran player: audible in silent mode, keeps playing
        // when the app goes to the background.
        void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" });
    }
    return player;
}

/** Play the adhan once. A no-op while one is already playing, or when the setting is off. */
export async function playAdhan(): Promise<void> {
    if (playing) return;
    if (!usePrayerStore.getState().adhanAudioEnabled) return;
    try {
        const asset = Asset.fromModule(adhanModuleId);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri) return;
        const audio = getPlayer();
        audio.replace({ uri });
        audio.play();
        playing = true;
    } catch {
        // The adhan is a nicety; never let playback break the reminder flow.
        playing = false;
    }
}

/** Stop a playing adhan, if any. */
export function stopAdhan(): void {
    if (!playing) return;
    playing = false;
    try {
        player?.pause();
    } catch {
        // ignore
    }
}

/** For tests: forget the player so each test starts fresh. */
export function resetAdhanForTests(): void {
    playing = false;
    player = null;
}
