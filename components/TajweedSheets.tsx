import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Sheet } from "@/components/ui/Sheet";
import { useTheme } from "@/components/useTheme";
import { getTajweedRule, tajweedColorKey, tajweedRules, type TajweedRuleId } from "@/constants/tajweed";

/** One rule: name, what it is, how to say it. */
export function RuleDetails({ ruleId }: { ruleId: TajweedRuleId }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const rule = getTajweedRule(ruleId);
    return (
        <View style={{ gap: spacing.md }}>
            <View style={styles.head}>
                <View style={[styles.swatch, { backgroundColor: colors.tajweed[tajweedColorKey[ruleId]], borderRadius: radius.sm }]} />
                <AppText variant="title" style={styles.flex}>
                    {t(`tajweed.rules.${ruleId}.name`)}
                </AppText>
                <AppText style={styles.arabicName} color={colors.ink2}>
                    {rule.arabic}
                </AppText>
            </View>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="label" muted>
                    {t("tajweed.what")}
                </AppText>
                <AppText>{t(`tajweed.rules.${ruleId}.what`)}</AppText>
            </View>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="label" muted>
                    {t("tajweed.how")}
                </AppText>
                <AppText>{t(`tajweed.rules.${ruleId}.how`)}</AppText>
            </View>
        </View>
    );
}

interface RuleSheetProps {
    ruleId: TajweedRuleId | null;
    onDismiss: () => void;
}

/** Opens when a coloured letter is tapped. */
export function RuleSheet({ ruleId, onDismiss }: RuleSheetProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing } = useTheme();
    return (
        <Sheet visible={ruleId !== null} onDismiss={onDismiss} title={t("tajweed.title")}>
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
                {ruleId ? <RuleDetails ruleId={ruleId} /> : null}
                <Pressable
                    onPress={() => {
                        onDismiss();
                        router.push("/tajweed");
                    }}
                    accessibilityRole="button"
                >
                    <AppText variant="bodyStrong" color={colors.mushaf}>
                        {`${t("tajweed.learn")} ›`}
                    </AppText>
                </Pressable>
            </View>
        </Sheet>
    );
}

interface LegendSheetProps {
    visible: boolean;
    onDismiss: () => void;
}

/** Every rule with its colour; tap one to read about it. */
export function LegendSheet({ visible, onDismiss }: LegendSheetProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const [selected, setSelected] = useState<TajweedRuleId | null>(null);

    return (
        <Sheet visible={visible} onDismiss={() => { setSelected(null); onDismiss(); }} title={t("tajweed.legend")} maxHeightRatio={0.85}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
                <AppText variant="caption" muted>
                    {t("tajweed.legendHint")}
                </AppText>
                <View style={styles.grid}>
                    {tajweedRules.map((rule) => {
                        const isSelected = selected === rule.id;
                        return (
                            <Pressable
                                key={rule.id}
                                onPress={() => setSelected(isSelected ? null : rule.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                                style={[styles.chip, { backgroundColor: isSelected ? colors.mushafSoft : colors.surface2, borderRadius: radius.md }]}
                            >
                                <View style={[styles.dot, { backgroundColor: colors.tajweed[tajweedColorKey[rule.id]] }]} />
                                <AppText variant="caption" numberOfLines={2} style={styles.flex}>
                                    {t(`tajweed.rules.${rule.id}.name`)}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </View>
                {selected ? <RuleDetails ruleId={selected} /> : null}
                <Pressable
                    onPress={() => {
                        onDismiss();
                        router.push("/tajweed");
                    }}
                    accessibilityRole="button"
                >
                    <AppText variant="bodyStrong" color={colors.mushaf}>
                        {`${t("tajweed.learn")} ›`}
                    </AppText>
                </Pressable>
            </ScrollView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    head: { flexDirection: "row", alignItems: "center", gap: 10 },
    swatch: { width: 14, height: 28 },
    arabicName: { fontSize: 18 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, width: "48.5%" },
    dot: { width: 12, height: 12, borderRadius: 6 },
});
