import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { PlateCard } from "@/components/ui/Plate";
import { useTheme } from "@/components/useTheme";
import { PRAYER_ARABIC } from "@/constants/prayerNames";
import { formatClock, type NextPrayer } from "@/services/prayerTimes";

interface NextPrayerCardProps {
    next: NextPrayer | null;
    timezone: string | null;
    /** Turns an instant into "3 h 27 min" and the like. */
    countdown: (at: Date) => string;
    /** Shown when there is no prayer to show yet. */
    placeholder?: string;
    onPress?: () => void;
}

/** The next prayer as a mushaf-style plate: the name in calligraphy, its time and the countdown. */
export function NextPrayerCard({ next, timezone, countdown, placeholder, onPress }: NextPrayerCardProps) {
    const { t } = useTranslation();
    const { colors, fonts } = useTheme();
    return (
        <PlateCard onPress={onPress} accessibilityLabel={next ? `${t("prayer.next")}: ${t(`prayer.names.${next.name}`)}, ${t("prayer.in", { time: countdown(next.at) })}` : undefined} style={styles.content}>
            <View style={styles.text}>
                <AppText variant="label" color={colors.heroAccent}>
                    {t("prayer.next")}
                </AppText>
                {next ? (
                    <>
                        <AppText style={[styles.name, { color: colors.heroInk }]}>{t(`prayer.names.${next.name}`)}</AppText>
                        <View style={styles.chips}>
                            {timezone ? (
                                <View style={[styles.chip, { backgroundColor: "rgba(255,255,255,0.14)" }]}>
                                    <AppText variant="bodyStrong" color={colors.heroInk} style={styles.clock}>
                                        {formatClock(next.at, timezone)}
                                    </AppText>
                                </View>
                            ) : null}
                            <AppText variant="bodyStrong" color={colors.heroAccent}>
                                {t("prayer.in", { time: countdown(next.at) })}
                            </AppText>
                        </View>
                    </>
                ) : (
                    <AppText color={colors.heroInk}>{placeholder}</AppText>
                )}
            </View>
            {next ? (
                <Text style={[styles.arabic, { fontFamily: fonts.quranBold, color: colors.heroAccent }]} accessibilityElementsHidden importantForAccessibility="no">
                    {PRAYER_ARABIC[next.name]}
                </Text>
            ) : null}
        </PlateCard>
    );
}

const styles = StyleSheet.create({
    content: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 22, paddingHorizontal: 22 },
    text: { flex: 1, gap: 4 },
    name: { fontSize: 34, lineHeight: 42, fontWeight: "700" },
    chips: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    clock: { fontVariant: ["tabular-nums"] },
    arabic: { fontSize: 46, lineHeight: 80, writingDirection: "rtl", textAlign: "right" },
});
