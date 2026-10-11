import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
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
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: done ? colors.mushaf : colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }]}>
            <AppText variant="bodyStrong">{item.title}</AppText>
            <AppText variant="arabic" size={26}>
                {item.arabic}
            </AppText>
            <AppText variant="caption" muted style={styles.italic}>
                {item.latin}
            </AppText>
            <AppText>{item.translation}</AppText>
            {item.source ? (
                <AppText variant="caption" muted>
                    {`${t("more.sourceLabel")}: ${item.source}`}
                </AppText>
            ) : null}
            {item.benefit ? (
                <Pressable onPress={() => setOpen((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                    <AppText variant="bodyStrong" color={colors.mushaf}>
                        {t("adhkar.benefit")}
                    </AppText>
                    {open ? (
                        <AppText variant="caption" muted style={{ marginTop: 4 }}>
                            {item.benefit}
                        </AppText>
                    ) : null}
                </Pressable>
            ) : null}
            <Pressable
                onPress={recite}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${count} / ${item.repeat}`}
                style={({ pressed }) => [styles.counter, { backgroundColor: done ? colors.mushaf : pressed ? colors.mushafSoft : colors.surface2, borderRadius: radius.pill }]}
            >
                {done ? <Ionicons name="checkmark" size={18} color={colors.onMushaf} /> : null}
                <AppText variant="bodyStrong" color={done ? colors.onMushaf : colors.ink}>
                    {done ? t("adhkar.done") : item.repeat > 1 ? `${count} / ${item.repeat}` : t("adhkar.markRead")}
                </AppText>
            </Pressable>
        </View>
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
                            <AppText variant="bodyStrong">{t("adhkar.progress", { done: completed, total: items.length })}</AppText>
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
    card: { borderWidth: StyleSheet.hairlineWidth },
    italic: { fontStyle: "italic", lineHeight: 20 },
    counter: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
    summary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
