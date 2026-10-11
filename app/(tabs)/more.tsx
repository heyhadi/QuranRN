import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { dateKey } from "@/services/khatam";
import { useKhatamStore } from "@/store/khatam";
import { useHifzStore } from "@/store/hifz";
import { useTasbihStore } from "@/store/tasbih";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function MoreScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const tasbihToday = useTasbihStore((state) => state.history[dateKey(new Date())] ?? 0);
    const khatamPlan = useKhatamStore((state) => state.plan);
    const memorized = useHifzStore((state) => Object.keys(state.memorized).length);

    const items: { icon: IconName; title: string; subtitle: string; onPress: () => void }[] = [
        { icon: "flag-outline", title: t("khatam.title"), subtitle: khatamPlan ? t("khatam.daysLeft", { count: Math.max(0, khatamPlan.targetDays) }) : t("khatam.intro"), onPress: () => router.push("/khatam") },
        { icon: "school-outline", title: t("hifz.title"), subtitle: t("hifz.count", { count: memorized }), onPress: () => router.push("/hifz") },
        { icon: "hand-left-outline", title: t("more.doa"), subtitle: t("more.doaIntro"), onPress: () => router.push("/doa") },
        { icon: "sparkles-outline", title: t("more.asma"), subtitle: t("more.asmaIntro"), onPress: () => router.push("/asma") },
        { icon: "ellipse-outline", title: t("more.tasbih"), subtitle: t("more.today", { count: tasbihToday }), onPress: () => router.push("/tasbih") },
        { icon: "school-outline", title: t("tajweed.title"), subtitle: t("tajweed.learnIntro"), onPress: () => router.push("/tajweed") },
    ];

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md }}>
                <AppText variant="display" accessibilityRole="header">
                    {t("more.title")}
                </AppText>
                {items.map((item) => (
                    <Pressable
                        key={item.title}
                        onPress={item.onPress}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.item, { backgroundColor: pressed ? colors.surface2 : colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg }]}
                    >
                        <View style={[styles.icon, { backgroundColor: colors.mushafSoft, borderRadius: radius.md }]}>
                            <Ionicons name={item.icon} size={22} color={colors.mushaf} />
                        </View>
                        <View style={styles.flex}>
                            <AppText variant="bodyStrong">{item.title}</AppText>
                            <AppText variant="caption" muted numberOfLines={2}>
                                {item.subtitle}
                            </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.ink2} />
                    </Pressable>
                ))}
                <AppText variant="caption" muted>
                    {t("more.adhkarNote")}
                </AppText>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    item: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: StyleSheet.hairlineWidth },
    icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
