import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextPrayerCard } from "@/components/NextPrayerCard";
import { QiblaCompass } from "@/components/QiblaCompass";
import { OrnateCard } from "@/components/ui/Plate";
import { AppText } from "@/components/ui/AppText";
import { usePrayerTimes } from "@/components/usePrayerTimes";
import { useTheme } from "@/components/useTheme";
import { dailyAyahFor } from "@/constants/dailyAyahs";
import { calculationMethods, minutesUntil, nextPrayer, PRAYER_NAMES, type PrayerName } from "@/services/prayerTimes";
import { SUHOOR_LEAD_MINUTES } from "@/services/ramadan";
import { getNotificationPermission, requestNotificationPermission, rescheduleReminders, setupAdhanPlayback, type PermissionState } from "@/services/notifications";
import { useKhatamStore } from "@/store/khatam";
import { usePrayerStore } from "@/store/prayer";

function useNow(intervalMs = 30_000): Date {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
}

export default function PrayerScreen() {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const { state, requestLocation, retry } = usePrayerTimes();
    const prayer = usePrayerStore();
    const khatamPlan = useKhatamStore((s) => s.plan);
    const now = useNow();
    const [permission, setPermission] = useState<PermissionState>("undetermined");

    useEffect(() => {
        void getNotificationPermission().then(setPermission);
        return setupAdhanPlayback();
    }, []);

    // Ask for the location once, the first time the tab opens with none saved.
    useEffect(() => {
        if (!prayer.location) void requestLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the scheduled reminders in step with the settings and the times we have.
    useEffect(() => {
        if (state.status !== "ready") return;
        void rescheduleReminders(
            {
                adhanEnabled: prayer.adhanEnabled,
                adhanAudioEnabled: prayer.adhanAudioEnabled,
                dailyAyahEnabled: prayer.dailyAyahEnabled,
                dailyAyahTime: prayer.dailyAyahTime,
                khatamReminderEnabled: prayer.khatamReminderEnabled,
                khatamReminderTime: prayer.khatamReminderTime,
                ramadanEnabled: prayer.ramadanEnabled,
            },
            state.days,
            state.timezone,
        );
    }, [state, prayer.adhanEnabled, prayer.adhanAudioEnabled, prayer.dailyAyahEnabled, prayer.dailyAyahTime, prayer.khatamReminderEnabled, prayer.khatamReminderTime, prayer.ramadanEnabled, permission]);

    const next = useMemo(() => (state.status === "ready" ? nextPrayer(state.days, state.timezone, now) : null), [state, now]);

    const allowNotifications = async () => setPermission(await requestNotificationPermission());
    const wantsReminders = Object.values(prayer.adhanEnabled).some(Boolean) || prayer.dailyAyahEnabled || prayer.khatamReminderEnabled || prayer.ramadanEnabled;

    const toggle = async (apply: () => void, enabling: boolean) => {
        if (enabling && permission !== "granted") {
            const result = await requestNotificationPermission();
            setPermission(result);
            if (result !== "granted") return;
        }
        apply();
    };

    const countdown = (at: Date) => {
        const minutes = minutesUntil(at, now);
        if (minutes <= 0) return t("prayer.now");
        return minutes >= 60 ? t("prayer.inHours", { hours: Math.floor(minutes / 60), minutes: minutes % 60 }) : t("prayer.inMinutes", { minutes });
    };

    let body: React.ReactNode;
    if (state.status === "loading") {
        body = (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.mushaf} />
                <AppText muted>{t("prayer.locating")}</AppText>
            </View>
        );
    } else if (state.status === "needs-location") {
        body = (
            <View style={styles.center}>
                <AppText style={styles.text}>{t("prayer.needLocation")}</AppText>
                {state.denied ? (
                    <Button mode="contained" onPress={() => Linking.openSettings()}>
                        {t("prayer.openSettings")}
                    </Button>
                ) : (
                    <Button mode="contained" onPress={requestLocation}>
                        {t("prayer.allow")}
                    </Button>
                )}
            </View>
        );
    } else if (state.status === "offline") {
        body = (
            <View style={styles.center}>
                <AppText style={styles.text}>{t("prayer.offline")}</AppText>
                <Button mode="contained" onPress={retry}>
                    {t("prayer.retry")}
                </Button>
            </View>
        );
    } else {
        const { today } = state;
        body = (
            <View style={{ gap: spacing.lg }}>
                <NextPrayerCard next={next} timezone={state.timezone} countdown={countdown} />

                <OrnateCard>
                    {PRAYER_NAMES.map((name, index) => {
                        const isNext = next?.name === name && next.at.getTime() === next.at.getTime();
                        return (
                            <View key={name} style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                                <View style={[styles.marker, { backgroundColor: isNext ? colors.brass : "transparent" }]} />
                                <AppText variant={isNext ? "bodyStrong" : "body"} color={isNext ? colors.mushaf : colors.ink} style={styles.flex}>
                                    {t(`prayer.names.${name}`)}
                                </AppText>
                                <AppText variant="bodyStrong" color={isNext ? colors.mushaf : colors.ink} style={styles.time}>
                                    {today.times[name]}
                                </AppText>
                            </View>
                        );
                    })}
                </OrnateCard>
                {state.isStale ? (
                    <AppText variant="caption" muted>
                        {t("prayer.offline")}
                    </AppText>
                ) : null}
            </View>
        );
    }

    const adhanSwitch = (name: PrayerName) => (
        <View key={name} style={styles.row}>
            <AppText style={styles.flex}>{t(`prayer.names.${name}`)}</AppText>
            <Switch
                value={prayer.adhanEnabled[name]}
                onValueChange={(value) => void toggle(() => prayer.setAdhan(name, value), value)}
                trackColor={{ true: colors.mushaf }}
                accessibilityLabel={`${t("prayer.notify")}: ${t(`prayer.names.${name}`)}`}
            />
        </View>
    );

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.xl }}>
                <AppText variant="display" accessibilityRole="header">
                    {t("prayer.title")}
                </AppText>

                {body}

                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("qibla.title")}
                    </AppText>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg }]}>
                        <QiblaCompass />
                    </View>
                </View>

                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("prayer.method")}
                    </AppText>
                    <View style={styles.chips}>
                        {calculationMethods.map((method) => {
                            const selected = method.id === prayer.methodId;
                            return (
                                <Pressable
                                    key={method.id}
                                    onPress={() => prayer.setMethodId(method.id)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                                >
                                    <AppText variant="caption" color={selected ? colors.onMushaf : colors.ink2} style={styles.bold}>
                                        {method.name}
                                    </AppText>
                                </Pressable>
                            );
                        })}
                    </View>
                    <AppText variant="caption" muted>
                        {t("prayer.methodHint")}
                    </AppText>
                    <Button mode="text" onPress={requestLocation} style={styles.alignStart}>
                        {t("prayer.refresh")}
                    </Button>
                </View>

                <View style={{ gap: spacing.sm }}>
                    <AppText variant="label" muted>
                        {t("reminders.title")}
                    </AppText>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }]}>
                        <AppText variant="bodyStrong">{t("prayer.notify")}</AppText>
                        {PRAYER_NAMES.map(adhanSwitch)}

                        <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: spacing.md }]}>
                            <View style={styles.flex}>
                                <AppText variant="bodyStrong">{t("prayer.adhanAudio")}</AppText>
                                <AppText variant="caption" muted>
                                    {t("prayer.adhanAudioHint")}
                                </AppText>
                            </View>
                            <Switch
                                value={prayer.adhanAudioEnabled}
                                onValueChange={prayer.setAdhanAudioEnabled}
                                trackColor={{ true: colors.mushaf }}
                                accessibilityLabel={t("prayer.adhanAudio")}
                            />
                        </View>

                        <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: spacing.md }]}>
                            <View style={styles.flex}>
                                <AppText variant="bodyStrong">{t("reminders.dailyAyah")}</AppText>
                                <AppText variant="caption" muted>
                                    {`${t("reminders.time")}: ${prayer.dailyAyahTime} · ${dailyAyahFor(now)}`}
                                </AppText>
                            </View>
                            <Switch value={prayer.dailyAyahEnabled} onValueChange={(value) => void toggle(() => prayer.setDailyAyahEnabled(value), value)} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("reminders.dailyAyah")} />
                        </View>
                        <View style={styles.row}>
                            <View style={styles.flex}>
                                <AppText variant="bodyStrong">{t("ramadan.reminders")}</AppText>
                                <AppText variant="caption" muted>
                                    {t("ramadan.remindersHint", { minutes: SUHOOR_LEAD_MINUTES })}
                                </AppText>
                            </View>
                            <Switch value={prayer.ramadanEnabled} onValueChange={(value) => void toggle(() => prayer.setRamadanEnabled(value), value)} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("ramadan.reminders")} />
                        </View>
                        {khatamPlan ? (
                            <View style={styles.row}>
                                <View style={styles.flex}>
                                    <AppText variant="bodyStrong">{t("reminders.khatam")}</AppText>
                                    <AppText variant="caption" muted>{`${t("reminders.time")}: ${prayer.khatamReminderTime}`}</AppText>
                                </View>
                                <Switch value={prayer.khatamReminderEnabled} onValueChange={(value) => void toggle(() => prayer.setKhatamReminderEnabled(value), value)} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("reminders.khatam")} />
                            </View>
                        ) : null}
                        {wantsReminders && permission === "denied" ? (
                            <View style={{ gap: spacing.sm }}>
                                <AppText variant="caption" color={colors.danger}>
                                    {t("reminders.permissionDenied")}
                                </AppText>
                                <Button mode="outlined" onPress={() => Linking.openSettings()}>
                                    {t("prayer.openSettings")}
                                </Button>
                            </View>
                        ) : permission === "undetermined" ? (
                            <Button mode="text" onPress={allowNotifications} style={styles.alignStart}>
                                {t("prayer.notifyAllow")}
                            </Button>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    center: { alignItems: "center", gap: 14, paddingVertical: 28 },
    text: { textAlign: "center" },
    hero: { gap: 2, alignItems: "flex-start" },
    heroName: { fontSize: 40, lineHeight: 48, fontWeight: "700" },
    card: { borderWidth: StyleSheet.hairlineWidth },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    time: { fontVariant: ["tabular-nums"] },
    marker: { width: 8, height: 8, borderRadius: 2, transform: [{ rotate: "45deg" }] },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7 },
    bold: { fontWeight: "600" },
    alignStart: { alignSelf: "flex-start" },
});
