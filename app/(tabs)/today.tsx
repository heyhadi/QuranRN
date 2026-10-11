import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { usePrayerTimes } from "@/components/usePrayerTimes";
import { useTheme } from "@/components/useTheme";
import { dailyAyahFor } from "@/constants/dailyAyahs";
import type { AppLanguage } from "@/i18n";
import { getAdhkar, routineForHour } from "@/services/adhkar";
import { currentStreak, dailyTarget, dateKey } from "@/services/khatam";
import { formatDates } from "@/services/hijri";
import { minutesUntil, nextPrayer } from "@/services/prayerTimes";
import { useEnglishTranslation, useSurahDetail } from "@/services/queries";
import { fastStatus, ramadanDay } from "@/services/ramadan";
import { translationText } from "@/services/richText";
import { completedIn, countsFor, useAdhkarStore } from "@/store/adhkar";
import { useHifzStore } from "@/store/hifz";
import { useKhatamStore } from "@/store/khatam";
import { useReadingProgressStore } from "@/store/readingProgress";
import { useSettingsStore } from "@/store/settings";
import { useTasbihStore } from "@/store/tasbih";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function useNow(intervalMs = 30_000): Date {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
}

/** A calm daily dashboard: the next prayer, an ayah for the day, today's reading goal, hifz and tasbih. */
export default function TodayScreen() {
    const { t, i18n } = useTranslation();
    const language = i18n.language as AppLanguage;
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const now = useNow();
    const { state } = usePrayerTimes();

    const plan = useKhatamStore((s) => s.plan);
    const log = useKhatamStore((s) => s.log);
    const todayRead = log[dateKey(now)] ?? 0;
    const streak = useMemo(() => currentStreak(log, now), [log, now]);
    const goal = plan ? dailyTarget(plan.targetDays) : 0;
    const lastRead = useReadingProgressStore((s) => s.lastRead);
    const memorized = useHifzStore((s) => Object.keys(s.memorized).length);
    const tasbihToday = useTasbihStore((s) => s.history[dateKey(now)] ?? 0);
    const englishTranslationId = useSettingsStore((s) => s.englishTranslationId);

    const routine = routineForHour(now.getHours());
    const adhkarItems = getAdhkar(routine, language === "id" ? "id" : "en");
    const adhkarState = useAdhkarStore();
    const adhkarDone = completedIn(countsFor(adhkarState, now), routine, adhkarItems.map((item) => item.repeat));

    const reference = dailyAyahFor(now);
    const [surahNumber, ayahNumber] = reference.split(":").map(Number);
    const detail = useSurahDetail(surahNumber);
    const english = useEnglishTranslation(surahNumber, englishTranslationId, language === "en");
    const ayah = detail.data?.ayahs.find((item) => item.ayahNumber === ayahNumber);
    const meaning = language === "en" && english.data?.[ayahNumber] ? translationText(english.data[ayahNumber]) : ayah?.translation;

    const next = useMemo(() => (state.status === "ready" ? nextPrayer(state.days, state.timezone, now) : null), [state, now]);
    const dates = useMemo(() => formatDates(now, language), [now, language]);
    const countdown = (at: Date) => {
        const minutes = minutesUntil(at, now);
        if (minutes <= 0) return t("prayer.now");
        return minutes >= 60 ? t("prayer.inHours", { hours: Math.floor(minutes / 60), minutes: minutes % 60 }) : t("prayer.inMinutes", { minutes });
    };

    const ramadan = state.status === "ready" ? ramadanDay(new Date(`${state.today.date}T12:00:00`)) : null;
    const fast = state.status === "ready" && ramadan !== null ? fastStatus(state.today, state.timezone, now) : null;
    const hour = now.getHours();
    const greeting = hour < 11 ? t("today.morning") : hour < 15 ? t("today.afternoon") : hour < 18 ? t("today.evening") : t("today.night");
    const goalDone = goal > 0 && todayRead >= goal;
    const progress = goal > 0 ? Math.min(1, todayRead / goal) : 0;

    const openAyah = () => router.push({ pathname: "/surah/[id]", params: { id: surahNumber, ayah: ayahNumber } });
    const continueReading = () => (lastRead ? router.push({ pathname: "/surah/[id]", params: { id: lastRead.surahNumber, ayah: lastRead.ayahNumber } }) : router.navigate("/"));

    const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg }];
    const quick = (icon: IconName, title: string, subtitle: string, onPress: () => void) => (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${subtitle}`}
            style={({ pressed }) => [styles.quick, { backgroundColor: pressed ? colors.surface2 : colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg }]}
        >
            <Ionicons name={icon} size={22} color={colors.mushaf} />
            <AppText variant="bodyStrong">{title}</AppText>
            <AppText variant="caption" muted>
                {subtitle}
            </AppText>
        </Pressable>
    );

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg }}>
                <View>
                    <AppText variant="display" accessibilityRole="header">
                        {greeting}
                    </AppText>
                    <AppText muted>{dates}</AppText>
                </View>

                <Pressable
                    onPress={() => router.navigate("/prayer")}
                    accessibilityRole="button"
                    style={[styles.hero, { backgroundColor: colors.heroBackground, borderRadius: radius.lg, padding: spacing.xl }]}
                >
                    <AppText variant="caption" color={colors.heroAccent}>
                        {t("prayer.next")}
                    </AppText>
                    {next ? (
                        <>
                            <AppText style={[styles.heroName, { color: colors.heroInk }]}>{t(`prayer.names.${next.name}`)}</AppText>
                            <AppText variant="title" color={colors.heroAccent}>
                                {t("prayer.in", { time: countdown(next.at) })}
                            </AppText>
                        </>
                    ) : (
                        <AppText style={{ color: colors.heroInk }}>{state.status === "loading" ? t("prayer.locating") : t("today.setupPrayer")}</AppText>
                    )}
                </Pressable>

                {fast && ramadan !== null && state.status === "ready" ? (
                    <View style={[card, { borderColor: colors.brass }]}>
                        <AppText variant="label" color={colors.brass}>
                            {t("ramadan.day", { day: ramadan })}
                        </AppText>
                        <AppText variant="title">
                            {fast.phase === "before"
                                ? t("ramadan.imsakIn", { time: countdown(fast.imsak) })
                                : fast.phase === "fasting"
                                  ? t("ramadan.iftarIn", { time: countdown(fast.iftar) })
                                  : t("ramadan.fastDone")}
                        </AppText>
                        <AppText variant="caption" muted>
                            {t("ramadan.times", { imsak: state.today.times.imsak, iftar: state.today.times.maghrib })}
                        </AppText>
                    </View>
                ) : null}

                <View style={card}>
                    <View style={styles.row}>
                        <AppText variant="label" muted style={styles.flex}>
                            {t("today.goal")}
                        </AppText>
                        {streak > 0 ? (
                            <View style={styles.row}>
                                <Ionicons name="flame" size={16} color={colors.brass} />
                                <AppText variant="caption" color={colors.brass}>
                                    {t("khatam.streakDays", { count: streak })}
                                </AppText>
                            </View>
                        ) : null}
                    </View>
                    {plan ? (
                        <>
                            <AppText variant="title">{goalDone ? t("khatam.todayDone") : t("khatam.todayRead", { read: todayRead, goal })}</AppText>
                            <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
                                <View style={[styles.fill, { backgroundColor: goalDone ? colors.brass : colors.mushaf, width: `${Math.round(progress * 100)}%` }]} />
                            </View>
                        </>
                    ) : (
                        <AppText muted>{t("today.noPlan")}</AppText>
                    )}
                    <Pressable onPress={plan ? continueReading : () => router.push("/khatam")} accessibilityRole="button" style={styles.link}>
                        <AppText variant="bodyStrong" color={colors.mushaf}>
                            {plan ? (lastRead ? t("today.continueAt", { surah: lastRead.surahNameLatin, ayah: lastRead.ayahNumber }) : t("khatam.continue")) : t("khatam.start")}
                        </AppText>
                        <Ionicons name="chevron-forward" size={16} color={colors.mushaf} />
                    </Pressable>
                </View>

                <Pressable onPress={openAyah} accessibilityRole="button" style={[card, { gap: spacing.md }]}>
                    <View style={styles.row}>
                        <AppText variant="label" muted style={styles.flex}>
                            {t("today.ayah")}
                        </AppText>
                        <AppText variant="caption" muted>
                            {reference}
                        </AppText>
                    </View>
                    {ayah ? (
                        <>
                            <AppText variant="arabic" size={26}>
                                {ayah.textArabic}
                            </AppText>
                            {meaning ? <AppText muted>{meaning}</AppText> : null}
                        </>
                    ) : (
                        <AppText muted>{detail.isError ? t("today.ayahOffline", { reference }) : t("common.loading")}</AppText>
                    )}
                </Pressable>

                <Pressable onPress={() => router.push("/adhkar")} accessibilityRole="button" style={[card, styles.adhkar]}>
                    <Ionicons name={adhkarDone >= adhkarItems.length ? "checkmark-circle" : "sunny-outline"} size={26} color={colors.mushaf} />
                    <View style={styles.flex}>
                        <AppText variant="bodyStrong">{t(`adhkar.todayTitle_${routine}`)}</AppText>
                        <AppText variant="caption" muted>
                            {t("adhkar.todayProgress", { done: adhkarDone, total: adhkarItems.length })}
                        </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.ink2} />
                </Pressable>

                <View style={styles.grid}>
                    {quick("school-outline", t("hifz.title"), t("hifz.count", { count: memorized }), () => router.push("/hifz"))}
                    {quick("ellipse-outline", t("more.tasbih"), t("more.today", { count: tasbihToday }), () => router.push("/tasbih"))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    card: { borderWidth: StyleSheet.hairlineWidth, gap: 10 },
    hero: { gap: 4 },
    heroName: { fontSize: 36, lineHeight: 44, fontWeight: "700" },
    track: { height: 8, borderRadius: 4, overflow: "hidden" },
    fill: { height: 8, borderRadius: 4 },
    link: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4 },
    adhkar: { flexDirection: "row", alignItems: "center", gap: 12 },
    grid: { flexDirection: "row", gap: 12 },
    quick: { flex: 1, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
});
