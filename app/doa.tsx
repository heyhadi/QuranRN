import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, SectionList, Share, StyleSheet, TextInput, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { filterDuas, groupDuas, type Dua } from "@/services/duas";
import { useDuas } from "@/services/queries";

function DuaCard({ dua }: { dua: Dua }) {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const [open, setOpen] = useState(false);
    return (
        <Pressable
            onPress={() => setOpen((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }]}
        >
            <View style={styles.head}>
                <AppText variant="bodyStrong" style={styles.flex}>
                    {dua.title}
                </AppText>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.ink2} />
            </View>
            {open ? (
                <View style={{ gap: spacing.md }}>
                    <AppText variant="arabic" size={26}>
                        {dua.arabic}
                    </AppText>
                    <AppText variant="caption" muted style={styles.italic}>
                        {dua.transliteration}
                    </AppText>
                    <AppText>{dua.meaning}</AppText>
                    {dua.source ? (
                        <AppText variant="caption" muted>
                            {`${t("more.sourceLabel")}: ${dua.source}`}
                        </AppText>
                    ) : null}
                    <Button mode="text" icon="share-variant-outline" onPress={() => void Share.share({ message: `${dua.arabic}\n\n${dua.transliteration}\n\n${dua.meaning}` })} style={styles.start}>
                        {t("reader.share", { ayah: "" }).trim()}
                    </Button>
                </View>
            ) : null}
        </Pressable>
    );
}

/** Everyday doa from equran.id: Arabic, transliteration and Indonesian meaning. */
export default function DoaScreen() {
    const { t } = useTranslation();
    const { colors, spacing, radius } = useTheme();
    const duas = useDuas();
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
                            <View style={[styles.search, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
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
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <AppText muted style={[styles.center, { padding: spacing.xl }]}>
                            {t("more.doaNone", { query })}
                        </AppText>
                    }
                    renderSectionHeader={({ section }) => (
                        <AppText variant="label" muted style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }} accessibilityRole="header">
                            {section.title}
                        </AppText>
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
    card: { borderWidth: StyleSheet.hairlineWidth },
    head: { flexDirection: "row", alignItems: "center", gap: 8 },
    italic: { fontStyle: "italic", lineHeight: 20 },
    start: { alignSelf: "flex-start" },
    search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
    input: { flex: 1, fontSize: 16, paddingVertical: 10 },
});
