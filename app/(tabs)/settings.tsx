import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { ReciterTile } from "@/components/ui/ReciterTile";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/useTheme";
import { getReciter, styleLabel } from "@/constants/reciters";
import { arabicFontSize } from "@/constants/theme";
import { useSettingsStore, type LanguagePreference, type ThemePreference } from "@/store/settings";

const SAMPLE_ARABIC = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const { colors, radius, spacing } = useTheme();
    return (
        <View style={{ gap: spacing.sm }}>
            <AppText variant="label" muted accessibilityRole="header" style={{ paddingHorizontal: spacing.xs }}>
                {title}
            </AppText>
            <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.line, padding: spacing.lg, gap: spacing.lg }]}>
                {children}
            </View>
        </View>
    );
}

export default function SettingsScreen() {
    const { t } = useTranslation();
    const { colors, spacing } = useTheme();
    const settings = useSettingsStore();
    const router = useRouter();
    const reciter = getReciter(settings.reciterId);

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.xl }}>
                <AppText variant="display" accessibilityRole="header">
                    {t("settings.title")}
                </AppText>

                <Section title={t("settings.appearance")}>
                    <SegmentedControl<ThemePreference>
                        value={settings.themePreference}
                        onChange={settings.setThemePreference}
                        accessibilityLabel={t("settings.appearance")}
                        options={(["system", "light", "dark"] as const).map((value) => ({ value, label: t(`settings.theme.${value}`) }))}
                    />
                </Section>

                <Section title={t("settings.language")}>
                    <SegmentedControl<LanguagePreference>
                        value={settings.languagePreference}
                        onChange={settings.setLanguagePreference}
                        accessibilityLabel={t("settings.language")}
                        options={(["system", "id", "en"] as const).map((value) => ({ value, label: t(`settings.languageOption.${value}`) }))}
                    />
                </Section>

                <Section title={t("settings.reading")}>
                    <View style={styles.row}>
                        <AppText variant="bodyStrong">{t("settings.arabicSize")}</AppText>
                        <View style={styles.stepper}>
                            <IconButton icon="remove" onPress={() => settings.stepArabicFontSize(-1)} disabled={settings.arabicFontSize <= arabicFontSize.min} accessibilityLabel={t("reader.smaller")} />
                            <AppText variant="bodyStrong" style={styles.value}>
                                {settings.arabicFontSize}
                            </AppText>
                            <IconButton icon="add" onPress={() => settings.stepArabicFontSize(1)} disabled={settings.arabicFontSize >= arabicFontSize.max} accessibilityLabel={t("reader.larger")} />
                        </View>
                    </View>
                    <AppText variant="arabic" size={settings.arabicFontSize} style={styles.sample}>
                        {SAMPLE_ARABIC}
                    </AppText>
                    <View style={styles.row}>
                        <AppText variant="bodyStrong" style={styles.flex}>
                            {t("settings.showTranslation")}
                        </AppText>
                        <Switch value={settings.showTranslation} onValueChange={settings.setShowTranslation} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("settings.showTranslation")} />
                    </View>
                    <AppText variant="caption" muted>
                        {t("settings.translationNote")}
                    </AppText>
                </Section>

                <Section title={t("settings.audio")}>
                    <Pressable
                        onPress={() => router.push("/reciters")}
                        accessibilityRole="button"
                        accessibilityLabel={`${t("settings.reciter")}: ${reciter.name}`}
                        style={styles.row}
                    >
                        <ReciterTile reciter={reciter} size={44} />
                        <View style={styles.flex}>
                            <AppText variant="label" muted>
                                {t("settings.reciter")}
                            </AppText>
                            <AppText variant="bodyStrong" numberOfLines={1}>
                                {reciter.name}
                            </AppText>
                            <AppText variant="caption" muted>
                                {styleLabel(reciter)}
                            </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.ink2} />
                    </Pressable>
                </Section>

                <Section title={t("settings.about")}>
                    <AppText variant="bodyStrong">{`Wird · ${t("settings.version", { version: Constants.expoConfig?.version ?? "1.0.0" })}`}</AppText>
                    <AppText variant="caption" muted>
                        {t("settings.credits")}
                    </AppText>
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    section: { borderWidth: StyleSheet.hairlineWidth },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    value: { minWidth: 28, textAlign: "center", fontVariant: ["tabular-nums"] },
    sample: { textAlign: "center" },
});
