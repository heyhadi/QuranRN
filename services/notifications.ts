import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "@/i18n";
import { dailyAyahFor } from "@/constants/dailyAyahs";
import { dateKey } from "./khatam";
import type { PrayerName } from "./prayerTimes";
import { planReminders, type PlannedReminder, type ReminderSettings } from "./reminders";
import type { DayTimes } from "./prayerTimes";

const CHANNEL_ID = "wird-reminders";

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
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

async function ensureChannel() {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Wird",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#0F5A46",
    });
}

function contentFor(reminder: PlannedReminder): Notifications.NotificationContentInput {
    const t = i18n.t.bind(i18n);
    switch (reminder.kind) {
        case "adhan":
            return { title: t(`prayer.names.${reminder.prayer as PrayerName}`), body: t("prayer.notifyBody", { prayer: t(`prayer.names.${reminder.prayer as PrayerName}`) }), sound: true };
        case "dailyAyah":
            // The text is not known at scheduling time (it comes from the network), so the reminder
            // names the ayah and opens it.
            return { title: t("reminders.dailyAyahTitle"), body: t("reminders.dailyAyahBody", { reference: dailyAyahFor(reminder.at) }), data: { open: dailyAyahFor(reminder.at) } };
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
    const anyEnabled = settings.dailyAyahEnabled || settings.khatamReminderEnabled || Object.values(settings.adhanEnabled).some(Boolean);
    if (!anyEnabled) return 0;
    if ((await getNotificationPermission()) !== "granted") return 0;
    await ensureChannel();

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
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId: CHANNEL_ID },
        });
    }
    return planned.length;
}

export async function cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
