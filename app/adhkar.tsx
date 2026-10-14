import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { OrnateCard } from "@/components/ui/Plate";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/useTheme";
import { ADHKAR_ROUTINES, getAdhkar, routineForHour, type AdhkarItem, type AdhkarLanguage, type AdhkarSetId } from "@/services/adhkar";
import { adhkarKey, completedIn, countsFor, useAdhkarStore } from "@/store/adhkar";

function AdhkarCard({ item, set, index }: { item: AdhkarItem; set: AdhkarSetId; index: number }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const state = useAdhkarStore();
    const count = countsFor(state, new Date())[adhkarKey(set, index)] ?? 0;
    const done = count >= item.repeat;
    const [open, setOpen] = useState(false);

    const recite = () => {
        if (done) return;
        const next = state.recite(set, index, item.repeat);
        void (next >= item.repeat ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    };

    return (
        <OrnateCard
            containerStyle={[
                styles.card,
                done && { borderColor: colors.mushaf, backgroundColor: colors.surface },
            ]}
            style={{ padding: spacing.lg, gap: spacing.md }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.flex}>
                    <AppText variant="bodyStrong" style={styles.titleText}>{item.title}</AppText>
                    {item.source ? (
                        <AppText variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
                            {item.source}
                        </AppText>
                    ) : null}
                </View>
                <View style={[styles.repeatBadge, { backgroundColor: done ? colors.mushafSoft : colors.surface2, borderRadius: radius.pill }]}>
                    {done ? (
                        <Ionicons name="checkmark" size={14} color={colors.mushaf} />
                    ) : null}
                    <AppText variant="caption" color={done ? colors.mushaf : colors.ink2} style={styles.badgeText}>
                        {done ? t("adhkar.done") : `${item.repeat}×`}
                    </AppText>
                </View>
            </View>

            <View style={[styles.arabicBox, { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.md }]}>
                <AppText variant="arabic" size={24} style={styles.arabicText}>
                    {item.arabic}
                </AppText>
            </View>

            {item.latin ? (
                <AppText variant="caption" muted style={styles.italic}>
                    {item.latin}
                </AppText>
            ) : null}

            <AppText style={styles.translationText}>{item.translation}</AppText>

            {item.benefit ? (
                <Pressable
                    onPress={() => setOpen((value) => !value)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    style={[styles.benefitBox, { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.sm }]}
                >
                    <View style={styles.benefitHeader}>
                        <Ionicons name="sparkles" size={14} color={colors.brass} />
                        <AppText variant="caption" color={colors.brass} style={styles.flex}>
                            {t("adhkar.benefit")}
                        </AppText>
                        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={colors.ink2} />
                    </View>
                    {open ? (
                        <AppText variant="caption" muted style={{ marginTop: 6, lineHeight: 18 }}>
                            {item.benefit}
                        </AppText>
                    ) : null}
                </Pressable>
            ) : null}

            <Pressable
                onPress={recite}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${count} / ${item.repeat}`}
                style={({ pressed }) => [
                    styles.counter,
                    {
                        backgroundColor: done ? colors.mushafSoft : pressed ? colors.mushafSoft : colors.surface2,
                        borderColor: done ? colors.mushaf : colors.line,
                        borderRadius: radius.pill,
                    },
                ]}
            >
                {!done && item.repeat > 1 && count > 0 ? (
                    <View
                        style={[
                            styles.counterProgress,
                            {
                                width: `${Math.min(100, (count / item.repeat) * 100)}%`,
                                backgroundColor: colors.mushafSoft,
                                borderRadius: radius.pill,
                            },
                        ]}
                    />
                ) : null}
                <View style={styles.counterRow}>
                    {done ? (
                        <Ionicons name="checkmark-circle" size={18} color={colors.mushaf} />
                    ) : (
                        <Ionicons name="finger-print-outline" size={18} color={colors.mushaf} />
                    )}
                    <AppText variant="bodyStrong" color={done ? colors.mushaf : colors.ink}>
                        {done ? t("adhkar.done") : item.repeat > 1 ? `${count} / ${item.repeat}` : t("adhkar.markRead")}
                    </AppText>
                </View>
            </Pressable>
        </OrnateCard>
    );
}

/** Morning, evening and after-prayer adhkar with a counter for each, reset every day. */
export default function AdhkarScreen() {
    const { t, i18n } = useTranslation();
    const { colors, spacing } = useTheme();
    const language: AdhkarLanguage = i18n.language === "id" ? "id" : "en";
    const [set, setSet] = useState<AdhkarSetId>(() => routineForHour(new Date().getHours()));
    const items = useMemo(() => getAdhkar(set, language), [set, language]);
    const state = useAdhkarStore();
    const completed = completedIn(
        countsFor(state, new Date()),
        set,
        items.map((item) => item.repeat),
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("adhkar.title") }} />
            <FlatList
                data={items}
                keyExtractor={(item, index) => `${set}:${index}`}
                contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
                ListHeaderComponent={
                    <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
                        <AppText muted>{t("adhkar.intro")}</AppText>
                        <SegmentedControl<AdhkarSetId>
                            options={ADHKAR_ROUTINES.map((value) => ({ value, label: t(`adhkar.sets.${value}`) }))}
                            value={set}
                            onChange={setSet}
                            accessibilityLabel={t("adhkar.title")}
                        />
                        <View style={styles.summary}>
                            <View style={styles.summaryLeft}>
                                <AppText variant="bodyStrong">{t("adhkar.progress", { done: completed, total: items.length })}</AppText>
                                {completed === items.length && items.length > 0 ? (
                                    <Ionicons name="checkmark-done-circle" size={16} color={colors.mushaf} />
                                ) : null}
                            </View>
                            {completed > 0 ? (
                                <Pressable onPress={() => state.resetSet(set)} accessibilityRole="button">
                                    <AppText variant="bodyStrong" color={colors.mushaf}>
                                        {t("adhkar.reset")}
                                    </AppText>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                }
                renderItem={({ item, index }) => <AdhkarCard item={item} set={set} index={index} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    card: { overflow: "hidden" },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    titleText: { fontSize: 16 },
    repeatBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontWeight: "600" },
    arabicBox: { width: "100%" },
    arabicText: { textAlign: "right", lineHeight: 46 },
    italic: { fontStyle: "italic", lineHeight: 22 },
    translationText: { lineHeight: 22 },
    benefitBox: { overflow: "hidden" },
    benefitHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    counter: {
        position: "relative",
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    counterProgress: { position: "absolute", left: 0, top: 0, bottom: 0 },
    counterRow: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
    summary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    summaryLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
});
