import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { TOTAL_AYAHS } from "@/constants/ayahCounts";
import { currentStreak, dailyTarget, dateKey, juzCompletion, khatamProgress, longestStreak } from "@/services/khatam";
import { juzStarts } from "@/services/juz";
import { useKhatamStore, useReadCount } from "@/store/khatam";
import { useReadingProgressStore } from "@/store/readingProgress";

const PLAN_OPTIONS = [30, 60, 90, 180] as const;

function ProgressBar({ fraction, color, track, height = 8 }: { fraction: number; color: string; track: string; height?: number }) {
    return (
        <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: "hidden" }}>
            <View style={{ width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`, height: "100%", backgroundColor: color, borderRadius: height / 2 }} />
        </View>
    );
}

export default function KhatamScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const { plan, read, log, completedRounds, startPlan, stopPlan, startNewRound } = useKhatamStore();
    const readCount = useReadCount();
    const lastRead = useReadingProgressStore((state) => state.lastRead);
    const [chosenDays, setChosenDays] = useState<number>(30);
    const today = new Date();
    const todayCount = log[dateKey(today)] ?? 0;
    const streak = currentStreak(log, today);
    const completion = useMemo(() => juzCompletion(read), [read]);
    const goal = plan ? dailyTarget(plan.targetDays) : dailyTarget(chosenDays);
    const progress = plan ? khatamProgress(readCount, new Date(`${plan.startDate}T12:00:00`), plan.targetDays, today) : null;
    const fraction = readCount / TOTAL_AYAHS;
    const percent = Math.floor(fraction * 100);

    return (
        <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
            <Stack.Screen options={{ title: t("khatam.title") }} />

            {/* Progress */}
            <View style={[styles.hero, { backgroundColor: colors.heroBackground, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md }]}>
                <View style={styles.heroRow}>
                    <AppText style={[styles.bigNumber, { color: colors.heroInk }]}>{t("khatam.percent", { value: percent })}</AppText>
                    <View style={styles.heroSide}>
                        <AppText variant="caption" color={colors.heroAccent}>
                            {t("khatam.progress", { read: readCount.toLocaleString(), total: TOTAL_AYAHS.toLocaleString() })}
                        </AppText>
                        {progress ? (
                            <AppText variant="caption" color={colors.heroInk}>
                                {t("khatam.daysLeft", { count: progress.daysLeft })}
                            </AppText>
                        ) : null}
                    </View>
                </View>
                <ProgressBar fraction={fraction} color={colors.heroAccent} track="rgba(255,255,255,0.18)" height={10} />
                {progress?.isFinished ? (
                    <AppText color={colors.heroInk}>{t("khatam.finished")}</AppText>
                ) : progress ? (
                    <AppText variant="caption" color={colors.heroInk}>
                        {t("khatam.paceNeeded", { count: progress.perDayToFinish })}
                    </AppText>
                ) : null}
            </View>

            {/* Plan setup, or today's goal */}
            {plan ? (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }]}>
                    <AppText variant="label" muted>
                        {t("khatam.today")}
                    </AppText>
                    <AppText variant="title">{t("khatam.todayRead", { read: todayCount, goal })}</AppText>
                    <ProgressBar fraction={todayCount / goal} color={todayCount >= goal ? colors.mushaf : colors.brass} track={colors.surface2} />
                    {todayCount >= goal ? (
                        <AppText variant="caption" color={colors.mushaf}>
                            {t("khatam.todayDone")}
                        </AppText>
                    ) : null}
                </View>
            ) : (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }]}>
                    <AppText muted>{t("khatam.intro")}</AppText>
                    <AppText variant="label" muted>
                        {t("khatam.chooseDays")}
                    </AppText>
                    <View style={styles.chips}>
                        {PLAN_OPTIONS.map((days) => {
                            const selected = days === chosenDays;
                            return (
                                <Pressable
                                    key={days}
                                    onPress={() => setChosenDays(days)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                                >
                                    <AppText variant="bodyStrong" color={selected ? colors.onMushaf : colors.ink2}>
                                        {t("khatam.days", { count: days })}
                                    </AppText>
                                </Pressable>
                            );
                        })}
                    </View>
                    <AppText variant="caption" muted>
                        {t("khatam.perDay", { count: goal })}
                    </AppText>
                    <Button mode="contained" onPress={() => startPlan(chosenDays)}>
                        {t("khatam.start")}
                    </Button>
                </View>
            )}

            {/* Streak */}
            <View style={styles.tiles}>
                <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg }]}>
                    <AppText variant="label" muted>
                        {t("khatam.streak")}
                    </AppText>
                    <AppText variant="title" color={streak > 0 ? colors.brass : colors.ink}>
                        {t("khatam.streakDays", { count: streak })}
                    </AppText>
                    <AppText variant="caption" muted>
                        {t("khatam.longest", { count: longestStreak(log) })}
                    </AppText>
                </View>
                {completedRounds > 0 ? (
                    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg }]}>
                        <AppText variant="label" muted>
                            {t("khatam.title")}
                        </AppText>
                        <AppText variant="title">{t("khatam.rounds", { count: completedRounds })}</AppText>
                    </View>
                ) : null}
            </View>

            {/* Juz map */}
            <View style={{ gap: spacing.sm }}>
                <AppText variant="label" muted>
                    {t("khatam.juzProgress")}
                </AppText>
                <View style={styles.juzGrid}>
                    {completion.map((share, index) => (
                        <Pressable
                            key={index}
                            onPress={() => router.push({ pathname: "/surah/[id]", params: { id: juzStarts[index].surahNumber, ayah: juzStarts[index].ayahNumber } })}
                            accessibilityRole="button"
                            accessibilityLabel={t("khatam.juzCell", { number: index + 1, percent: Math.round(share * 100) })}
                            style={[styles.juzCell, { backgroundColor: colors.surface2, borderRadius: radius.sm }]}
                        >
                            <View style={[styles.juzFill, { backgroundColor: share >= 1 ? colors.mushaf : colors.brass, height: `${Math.round(share * 100)}%`, opacity: share >= 1 ? 1 : 0.7 }]} />
                            <AppText variant="caption" color={share >= 1 ? colors.onMushaf : colors.ink} style={styles.juzLabel}>
                                {index + 1}
                            </AppText>
                        </Pressable>
                    ))}
                </View>
            </View>

            {readCount === 0 ? <AppText muted>{t("khatam.noReading")}</AppText> : null}

            {lastRead ? (
                <Button mode="contained-tonal" onPress={() => router.push({ pathname: "/surah/[id]", params: { id: lastRead.surahNumber, ayah: lastRead.ayahNumber } })}>
                    {t("khatam.continue")}
                </Button>
            ) : null}

            {plan ? (
                <View style={{ gap: spacing.sm, alignItems: "flex-start" }}>
                    {progress?.isFinished ? <Button mode="contained" onPress={startNewRound}>{t("khatam.newRound")}</Button> : null}
                    <Button onPress={stopPlan} textColor={colors.danger}>
                        {t("khatam.stop")}
                    </Button>
                    <AppText variant="caption" muted>
                        {t("khatam.stopHint")}
                    </AppText>
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    hero: { overflow: "hidden" },
    heroRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
    heroSide: { alignItems: "flex-end", gap: 2, paddingBottom: 6 },
    bigNumber: { fontSize: 52, lineHeight: 58, fontWeight: "700", fontVariant: ["tabular-nums"] },
    card: { borderWidth: StyleSheet.hairlineWidth },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8 },
    tiles: { flexDirection: "row", gap: 12 },
    tile: { flex: 1, borderWidth: StyleSheet.hairlineWidth, gap: 2 },
    juzGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    juzCell: { width: "13.6%", aspectRatio: 1, overflow: "hidden", justifyContent: "flex-end", alignItems: "center" },
    juzFill: { position: "absolute", bottom: 0, left: 0, right: 0 },
    juzLabel: { position: "absolute", top: "30%", fontWeight: "700", fontVariant: ["tabular-nums"] },
});
