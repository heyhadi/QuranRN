import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { ReciterTile } from "@/components/ui/ReciterTile";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/components/useTheme";
import { defaultTafsirFor, englishTranslations, tafsirEditions } from "@/constants/editions";
import { dataSaverCount, getReciter, reciters, styleLabel, type AudioQuality } from "@/constants/reciters";
import { versionLabel } from "@/constants/build";
import { cacheSizeBytes, clearAudioCache, formatBytes } from "@/services/audioCache";
import { FEEDBACK_EMAIL, issueUrl, mailUrl, REPO_URL } from "@/constants/links";
import { arabicFontSize } from "@/constants/theme";
import { useSettingsStore, type LanguagePreference, type ThemePreference } from "@/store/settings";

function Chips<T extends string | number>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
    const { colors, radius } = useTheme();
    return (
        <View style={styles.chips}>
            {options.map((option) => {
                const selected = option.id === value;
                return (
                    <Pressable
                        key={String(option.id)}
                        onPress={() => onChange(option.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2, borderRadius: radius.pill }]}
                    >
                        <AppText variant="caption" color={selected ? colors.onMushaf : colors.ink2} style={styles.bold}>
                            {option.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

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
    const { t, i18n } = useTranslation();
    const [cacheBytes, setCacheBytes] = React.useState(0);
    React.useEffect(() => setCacheBytes(cacheSizeBytes()), []);
    const feedbackContext = { version: Constants.expoConfig?.version ?? "1.0.0", platform: Platform.OS, osVersion: String(Platform.Version), language: i18n.language };
    const { colors, spacing } = useTheme();
    const settings = useSettingsStore();
    const params = useLocalSearchParams<{ lang?: string; theme?: string }>();
    React.useEffect(() => {
        if (params.lang === "en" || params.lang === "id" || params.lang === "system") {
            settings.setLanguagePreference(params.lang as LanguagePreference);
        }
        if (params.theme === "light" || params.theme === "dark" || params.theme === "system") {
            settings.setThemePreference(params.theme as ThemePreference);
        }
    }, [params.lang, params.theme]);
    const language = i18n.language === "id" ? "id" : "en";
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
                    <View style={styles.row}>
                        <AppText variant="bodyStrong" style={styles.flex}>
                            {t("settingsReading.transliteration")}
                        </AppText>
                        <Switch value={settings.showTransliteration} onValueChange={settings.setShowTransliteration} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("settingsReading.transliteration")} />
                    </View>
                    <View style={styles.row}>
                        <View style={styles.flex}>
                            <AppText variant="bodyStrong">{t("settingsReading.tajweed")}</AppText>
                            <AppText variant="caption" muted>
                                {t("settingsReading.tajweedNote")}
                            </AppText>
                        </View>
                        <Switch value={settings.tajweedEnabled} onValueChange={settings.setTajweedEnabled} trackColor={{ true: colors.mushaf }} accessibilityLabel={t("settingsReading.tajweed")} />
                    </View>
                    <Pressable onPress={() => router.push("/tajweed")} accessibilityRole="button" style={styles.row}>
                        <AppText variant="bodyStrong" color={colors.mushaf} style={styles.flex}>
                            {t("tajweed.learn")}
                        </AppText>
                        <Ionicons name="chevron-forward" size={20} color={colors.ink2} />
                    </Pressable>
                    <View style={{ gap: spacing.sm }}>
                        <AppText variant="bodyStrong">{t("settingsReading.translationEdition")}</AppText>
                        <Chips options={englishTranslations.map((edition) => ({ id: edition.id, label: edition.name }))} value={settings.englishTranslationId} onChange={settings.setEnglishTranslationId} />
                    </View>
                    <View style={{ gap: spacing.sm }}>
                        <AppText variant="bodyStrong">{t("settingsReading.tafsir")}</AppText>
                        <Chips
                            options={tafsirEditions.map((edition) => ({ id: String(edition.id), label: edition.name }))}
                            value={String(settings.tafsirChoice ?? defaultTafsirFor(language))}
                            onChange={(id) => settings.setTafsirChoice(id === "kemenag" ? "kemenag" : Number(id))}
                        />
                        <AppText variant="caption" muted>
                            {settings.tafsirChoice === null ? t("settingsReading.tafsirFollow") : ""}
                        </AppText>
                    </View>
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
                    <View style={{ gap: spacing.sm }}>
                        <AppText variant="bodyStrong">{t("settings.audioQuality")}</AppText>
                        <SegmentedControl<AudioQuality>
                            options={[
                                { value: "standard", label: t("settings.qualityStandard") },
                                { value: "dataSaver", label: t("settings.qualityDataSaver") },
                            ]}
                            value={settings.audioQuality}
                            onChange={settings.setAudioQuality}
                            accessibilityLabel={t("settings.audioQuality")}
                        />
                        <AppText variant="caption" muted>
                            {t("settings.qualityHint", { count: dataSaverCount, total: reciters.length })}
                        </AppText>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.flex}>
                            <AppText variant="bodyStrong">{t("settings.audioCache")}</AppText>
                            <AppText variant="caption" muted>
                                {t("settings.audioCacheHint", { size: formatBytes(cacheBytes) })}
                            </AppText>
                        </View>
                        <Pressable
                            onPress={() => {
                                clearAudioCache();
                                setCacheBytes(cacheSizeBytes());
                            }}
                            disabled={cacheBytes === 0}
                            accessibilityRole="button"
                            accessibilityLabel={t("settings.clearCache")}
                            style={{ opacity: cacheBytes === 0 ? 0.4 : 1 }}
                        >
                            <AppText variant="bodyStrong" color={colors.mushaf}>
                                {t("settings.clearCache")}
                            </AppText>
                        </Pressable>
                    </View>
                </Section>

                <Section title={t("settings.feedback")}>
                    {[
                        { icon: "mail-outline" as const, title: t("settings.sendEmail"), hint: t("settings.sendEmailHint"), url: mailUrl(feedbackContext) },
                        { icon: "bug-outline" as const, title: t("settings.reportProblem"), hint: t("settings.reportProblemHint"), url: issueUrl("bug", feedbackContext) },
                        { icon: "bulb-outline" as const, title: t("settings.suggestIdea"), hint: t("settings.suggestIdeaHint"), url: issueUrl("feature", feedbackContext) },
                        { icon: "logo-github" as const, title: t("settings.github"), hint: REPO_URL.replace("https://", ""), url: REPO_URL },
                    ].map((item) => (
                        <Pressable key={item.title} onPress={() => void Linking.openURL(item.url).catch(() => Alert.alert(t("settings.openFailed"), item.url.startsWith("mailto:") ? FEEDBACK_EMAIL : item.url))} accessibilityRole="link" accessibilityLabel={item.title} style={styles.row}>
                            <Ionicons name={item.icon} size={22} color={colors.mushaf} />
                            <View style={styles.flex}>
                                <AppText variant="bodyStrong">{item.title}</AppText>
                                <AppText variant="caption" muted>
                                    {item.hint}
                                </AppText>
                            </View>
                            <Ionicons name="open-outline" size={18} color={colors.ink2} />
                        </Pressable>
                    ))}
                    <AppText variant="caption" muted>
                        {t("settings.feedbackNote")}
                    </AppText>
                </Section>

                <Section title={t("settings.about")}>
                    <AppText variant="bodyStrong">{`Wird · ${t("settings.version", { version: versionLabel(Constants.expoConfig?.version, Constants.expoConfig?.extra?.build) })}`}</AppText>
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
    bold: { fontWeight: "600" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7 },
    section: { borderWidth: StyleSheet.hairlineWidth },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    value: { minWidth: 28, textAlign: "center", fontVariant: ["tabular-nums"] },
    sample: { textAlign: "center" },
});
