import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { dateKey } from "@/services/khatam";
import { TASBIH_TARGETS, useTasbihStore } from "@/store/tasbih";

export default function TasbihScreen() {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const { count, target, history, tap, reset, setTarget } = useTasbihStore();
    const today = history[dateKey(new Date())] ?? 0;
    const round = Math.min(count % target || (count > 0 ? target : 0), target);

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper, padding: spacing.lg, gap: spacing.xl }]}>
            <Stack.Screen options={{ title: t("more.tasbih") }} />
            <AppText muted style={styles.center}>
                {t("more.tasbihIntro")}
            </AppText>

            <View style={styles.targets}>
                {TASBIH_TARGETS.map((value) => {
                    const selected = value === target;
                    return (
                        <Pressable
                            key={value}
                            onPress={() => setTarget(value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`${t("more.target")} ${value}`}
                            style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                        >
                            <AppText variant="bodyStrong" color={selected ? colors.onMushaf : colors.ink2}>
                                {value}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>

            <Pressable
                onPress={() => {
                    const milestone = tap();
                    void (milestone ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
                }}
                accessibilityRole="button"
                accessibilityLabel={`${t("more.tap")}: ${count}`}
                style={({ pressed }) => [styles.button, { backgroundColor: colors.heroBackground, borderColor: colors.heroAccent, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
                <AppText style={[styles.count, { color: colors.heroInk }]}>{count}</AppText>
                <AppText variant="caption" color={colors.heroAccent}>
                    {`${round} / ${target}`}
                </AppText>
                <AppText variant="caption" color={colors.heroInk} style={styles.dim}>
                    {t("more.tap")}
                </AppText>
            </Pressable>

            <View style={styles.footer}>
                <AppText muted>{t("more.today", { count: today })}</AppText>
                <Button mode="outlined" onPress={reset}>
                    {t("more.reset")}
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, alignItems: "stretch" },
    center: { textAlign: "center" },
    targets: { flexDirection: "row", justifyContent: "center", gap: 10 },
    chip: { paddingHorizontal: 18, paddingVertical: 8 },
    button: { alignSelf: "center", width: 250, height: 250, borderRadius: 125, borderWidth: 3, alignItems: "center", justifyContent: "center", gap: 2 },
    count: { fontSize: 72, lineHeight: 80, fontWeight: "700", fontVariant: ["tabular-nums"] },
    dim: { opacity: 0.8, marginTop: 6 },
    footer: { alignItems: "center", gap: 12 },
});
