import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "@/i18n";
import { dailyAyahFor } from "@/constants/dailyAyahs";
import { playAdhan, stopAdhan } from "./adhan";
import { dateKey } from "./khatam";
import type { PrayerName } from "./prayerTimes";
import { SUHOOR_LEAD_MINUTES } from "./ramadan";
import { planReminders, type PlannedReminder, type ReminderSettings } from "./reminders";
import type { DayTimes } from "./prayerTimes";
import { usePrayerStore } from "@/store/prayer";

const CHANNEL_ID = "wird-reminders";
/**
 * Android channel whose sound is the adhan itself, so the system plays it when
 * the notification fires — even when the app is killed. Note: once a channel
 * exists on a device its sound cannot be changed; a different sound would need
 * a new channel id. The sound file is bundled via the expo-notifications
 * plugin `sounds` option in app.json.
 */
export const ADHAN_CHANNEL_ID = "wird-adhan";
/** Base filename of the bundled adhan sound, as the plugin copies it. */
const ADHAN_SOUND = "adhan.mp3";

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const data = notification.request.content.data as { kind?: unknown } | undefined;
        const isAdhan = data?.kind === "adhan";
        const adhanAudio = usePrayerStore.getState().adhanAudioEnabled;
        return {
            shouldShowBanner: true,
            shouldShowList: true,
            // On iOS the full adhan is played by the in-app player (setupAdhanPlayback),
            // so suppress the short default ding there to avoid overlap.
            shouldPlaySound: !(Platform.OS === "ios" && isAdhan && adhanAudio),
            shouldSetBadge: false,
        };
    },
});

export type PermissionState = "granted" | "denied" | "undetermined";

export async function getNotificationPermission(): Promise<PermissionState> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";
}

/** Ask the OS for permission. Only call this from a user action, so the prompt has context. */
export async function requestNotificationPermission(): Promise<PermissionState> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted" ? "granted" : "denied";
}

async function ensureChannels() {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Wird",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#0F5A46",
    });
    await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
        name: "Adhan",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#0F5A46",
        sound: ADHAN_SOUND,
    });
}

/** The data payload marking a notification as an adhan one. */
function dataFor(reminder: PlannedReminder): Record<string, string> | undefined {
    return reminder.kind === "adhan" ? { kind: "adhan", prayer: reminder.prayer ?? "" } : undefined;
}

/** Adhan reminders go through the adhan channel on Android so the system plays the adhan sound. */
function channelIdFor(reminder: PlannedReminder, settings: ReminderSettings): string {
    return reminder.kind === "adhan" && settings.adhanAudioEnabled && Platform.OS === "android" ? ADHAN_CHANNEL_ID : CHANNEL_ID;
}

function contentFor(reminder: PlannedReminder): Notifications.NotificationContentInput {
    const t = i18n.t.bind(i18n);
    switch (reminder.kind) {
        case "adhan":
            return {
                title: t(`prayer.names.${reminder.prayer as PrayerName}`),
                body: t("prayer.notifyBody", { prayer: t(`prayer.names.${reminder.prayer as PrayerName}`) }),
                sound: true,
                data: dataFor(reminder),
            };
        case "dailyAyah":
            // The text is not known at scheduling time (it comes from the network), so the reminder
            // names the ayah and opens it.
            return { title: t("reminders.dailyAyahTitle"), body: t("reminders.dailyAyahBody", { reference: dailyAyahFor(reminder.at) }), data: { open: dailyAyahFor(reminder.at) } };
        case "suhoor":
            return { title: t("ramadan.suhoorTitle"), body: t("ramadan.suhoorBody", { time: reminder.imsak ?? "", minutes: SUHOOR_LEAD_MINUTES }), sound: true };
        case "iftar":
            return { title: t("ramadan.iftarTitle"), body: t("ramadan.iftarBody"), sound: true };
        case "khatam":
            return { title: t("reminders.khatamTitle"), body: t("reminders.khatamBody"), data: { open: "khatam" } };
    }
}

/**
 * Replace every scheduled reminder with a fresh plan. Safe to call as often as settings or times change:
 * the old ones are cleared first, so nothing is ever scheduled twice.
 */
export async function rescheduleReminders(settings: ReminderSettings, days: DayTimes[], timezone: string): Promise<number> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const anyEnabled = settings.ramadanEnabled || settings.dailyAyahEnabled || settings.khatamReminderEnabled || Object.values(settings.adhanEnabled).some(Boolean);
    if (!anyEnabled) return 0;
    if ((await getNotificationPermission()) !== "granted") return 0;
    await ensureChannels();

    const now = new Date();
    const localDate = (offset: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() + offset);
        return dateKey(date);
    };
    const planned = planReminders(settings, days, timezone, now, localDate);
    for (const reminder of planned) {
        await Notifications.scheduleNotificationAsync({
            identifier: reminder.id,
            content: contentFor(reminder),
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId: channelIdFor(reminder, settings) },
        });
    }
    return planned.length;
}

export async function cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

function isAdhanNotification(notification: Notifications.Notification): boolean {
    const data = notification.request.content.data as { kind?: unknown } | undefined;
    return data?.kind === "adhan";
}

/**
 * Play the adhan when its notification arrives, and stop it when the
 * notification is tapped.
 *
 * On Android the adhan channel already plays the sound at the system level
 * (even with the app killed), so the in-app player below is only needed on
 * iOS, where a bundled notification sound is capped at 30 seconds. Tapping an
 * adhan notification also dismisses it, which stops the system sound.
 */
export function setupAdhanPlayback(): () => void {
    const received = Notifications.addNotificationReceivedListener((notification) => {
        if (Platform.OS !== "ios") return;
        if (isAdhanNotification(notification)) void playAdhan();
    });
    const responded = Notifications.addNotificationResponseReceivedListener((response) => {
        if (!isAdhanNotification(response.notification)) return;
        stopAdhan();
        void Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => undefined);
    });
    return () => {
        received.remove();
        responded.remove();
    };
}
