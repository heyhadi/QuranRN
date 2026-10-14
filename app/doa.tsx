import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, SectionList, Share, StyleSheet, TextInput, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { OrnateCard } from "@/components/ui/Plate";
import { useTheme } from "@/components/useTheme";
import { getAdhkar } from "@/services/adhkar";
import { filterDuas, groupDuas, type Dua } from "@/services/duas";
import { useDuas } from "@/services/queries";

function DuaCard({ dua }: { dua: Dua }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const [open, setOpen] = useState(false);
    return (
        <OrnateCard style={{ padding: spacing.lg, gap: spacing.md }}>
            <Pressable
                onPress={() => setOpen((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={dua.title}
                accessibilityState={{ expanded: open }}
                style={styles.head}
            >
                <View style={[styles.iconWrap, { backgroundColor: colors.surface2, borderRadius: radius.sm }]}>
                    <Ionicons name="sparkles-outline" size={14} color={colors.brass} />
                </View>
                <AppText variant="bodyStrong" style={styles.flex}>
                    {dua.title}
                </AppText>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.ink2} />
            </Pressable>
            {open ? (
                <View style={[styles.expandedContent, { borderTopColor: colors.line, paddingTop: spacing.md, gap: spacing.md }]}>
                    <View style={[styles.arabicBox, { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.md }]}>
                        <AppText variant="arabic" size={24} style={styles.arabicText}>
                            {dua.arabic}
                        </AppText>
                    </View>
                    {dua.transliteration ? (
                        <AppText variant="caption" muted style={styles.italic}>
                            {dua.transliteration}
                        </AppText>
                    ) : null}
                    <AppText style={styles.meaningText}>{dua.meaning}</AppText>
                    {dua.source ? (
                        <View style={[styles.sourceBox, { backgroundColor: colors.surface2, borderRadius: radius.sm, padding: spacing.sm }]}>
                            <Ionicons name="book-outline" size={13} color={colors.ink2} style={{ marginTop: 2 }} />
                            <AppText variant="caption" muted style={styles.sourceText}>
                                {dua.source.toLowerCase().startsWith("sumber") || dua.source.toLowerCase().startsWith("source")
                                    ? dua.source
                                    : `${t("more.sourceLabel")}: ${dua.source}`}
                            </AppText>
                        </View>
                    ) : null}
                    <Pressable
                        onPress={() => void Share.share({ message: `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration ? dua.transliteration + "\n\n" : ""}${dua.meaning}${dua.source ? "\n\n(" + dua.source + ")" : ""}` })}
                        style={({ pressed }) => [
                            styles.shareBtn,
                            {
                                backgroundColor: pressed ? colors.mushafSoft : colors.surface2,
                                borderRadius: radius.pill,
                            },
                        ]}
                    >
                        <Ionicons name="share-outline" size={14} color={colors.ink} />
                        <AppText variant="caption" color={colors.ink} style={styles.shareText}>
                            {t("more.shareDua")}
                        </AppText>
                    </Pressable>
                </View>
            ) : null}
        </OrnateCard>
    );
}

/** The English dua list: bundled, so it works offline, with the hadith source for each. */
function bundledDuas(groupNames: { daily: string; selected: string }): Dua[] {
    let id = 0;
    const from = (set: "dailyDua" | "selectedDua", group: string): Dua[] =>
        getAdhkar(set, "en").map((item) => ({ id: ++id, group, title: item.title, arabic: item.arabic, transliteration: item.latin, meaning: item.translation, source: item.source }));
    return [...from("dailyDua", groupNames.daily), ...from("selectedDua", groupNames.selected)];
}

/** Everyday dua: from equran.id in Indonesian (Arabic, transliteration, meaning), bundled in English. */
export default function DoaScreen() {
    const { t, i18n } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const isEnglish = i18n.language !== "id";
    const remote = useDuas(!isEnglish);
    const duas = useMemo(
        () => (isEnglish ? { data: bundledDuas({ daily: t("more.duaDaily"), selected: t("more.duaSelected") }), isPending: false, isError: false, refetch: () => undefined } : remote),
        [isEnglish, remote, t],
    );
    const [query, setQuery] = useState("");
    const sections = useMemo(() => groupDuas(filterDuas(duas.data ?? [], query)).map((group) => ({ title: group.name, data: group.duas })), [duas.data, query]);

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("more.doa") }} />
            {duas.isPending ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.mushaf} />
                </View>
            ) : duas.isError ? (
                <View style={styles.centered}>
                    <AppText style={styles.center}>{t("more.doaLoadError")}</AppText>
                    <Button mode="contained" onPress={() => duas.refetch()}>
                        {t("common.tryAgain")}
                    </Button>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    stickySectionHeadersEnabled={false}
                    ListHeaderComponent={
                        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                            <AppText muted>{t("more.doaIntro")}</AppText>
                            <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md }]}>
                                <Ionicons name="search" size={18} color={colors.ink2} />
                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder={t("more.doaSearch")}
                                    placeholderTextColor={colors.ink2}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    clearButtonMode="while-editing"
                                    accessibilityLabel={t("more.doaSearch")}
                                    style={[styles.input, { color: colors.ink }]}
                                />
                                {query ? (
                                    <Pressable onPress={() => setQuery("")} accessibilityLabel={t("common.clear")}>
                                        <Ionicons name="close-circle" size={18} color={colors.ink2} />
                                    </Pressable>
                                ) : null}
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <AppText muted style={[styles.center, { padding: spacing.xl }]}>
                            {t("more.doaNone", { query })}
                        </AppText>
                    }
                    renderSectionHeader={({ section }) => (
                        <View style={styles.sectionHeaderWrap}>
                            <Ionicons name="sparkles" size={12} color={colors.brass} style={{ opacity: 0.8 }} />
                            <AppText variant="label" muted style={styles.sectionHeaderText} accessibilityRole="header">
                                {section.title}
                            </AppText>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
                            <DuaCard dua={item} />
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: spacing.xxl }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    center: { textAlign: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    head: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconWrap: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
    expandedContent: { borderTopWidth: StyleSheet.hairlineWidth },
    arabicBox: { width: "100%" },
    arabicText: { textAlign: "right", lineHeight: 46 },
    italic: { fontStyle: "italic", lineHeight: 22 },
    meaningText: { lineHeight: 22 },
    sourceBox: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
    sourceText: { flex: 1, lineHeight: 18 },
    shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6 },
    shareText: { fontWeight: "600" },
    search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth },
    input: { flex: 1, fontSize: 16, paddingVertical: 10 },
    sectionHeaderWrap: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    sectionHeaderText: { letterSpacing: 0.5 },
});
