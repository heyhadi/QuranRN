import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, SectionList, StyleSheet, TextInput, View } from "react-native";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AppText } from "@/components/ui/AppText";
import { ReciterTile } from "@/components/ui/ReciterTile";
import { useTheme } from "@/components/useTheme";
import { reciters, styleLabel, type Reciter, type ReciterStyle } from "@/constants/reciters";
import { useAudioPlayerStore } from "@/store/audioPlayer";
import { useSettingsStore } from "@/store/settings";

type Filter = "all" | ReciterStyle | "english";
const FILTERS: Filter[] = ["all", "Murattal", "Mujawwad", "Muallim", "english"];

function matches(reciter: Reciter, query: string, filter: Filter): boolean {
    if (filter === "english" && !reciter.englishAudio) return false;
    if (filter !== "all" && filter !== "english" && !reciter.styles.includes(filter)) return false;
    const needle = query.trim().toLowerCase();
    return !needle || reciter.name.toLowerCase().includes(needle) || reciter.arabic.includes(needle);
}

export default function RecitersScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius } = useTheme();
    const { reciterId, setReciterId, favouriteReciterIds, toggleFavouriteReciter } = useSettingsStore();
    const previewReciterId = useAudioPlayerStore((state) => state.previewReciterId);
    const togglePreview = useAudioPlayerStore((state) => state.togglePreview);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");

    const sections = useMemo(() => {
        const visible = reciters.filter((reciter) => matches(reciter, query, filter));
        const favourites = visible.filter((reciter) => favouriteReciterIds.includes(reciter.id));
        const rest = visible.filter((reciter) => !favouriteReciterIds.includes(reciter.id));
        const popular = rest.filter((reciter) => reciter.popular);
        const others = rest.filter((reciter) => !reciter.popular);
        return [
            { title: t("reciters.favourites"), data: favourites },
            { title: t("reciters.popular"), data: popular },
            { title: t("reciters.all"), data: others },
        ].filter((section) => section.data.length > 0);
    }, [query, filter, favouriteReciterIds, t]);

    const filterLabel = (value: Filter) => (value === "all" ? t("reciters.filterAll") : value === "english" ? t("reciters.filterEnglish") : value);

    const header = (
        <View style={{ gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.sm }}>
            <View style={[styles.search, { backgroundColor: colors.surface2, borderRadius: radius.md }]}>
                <Ionicons name="search" size={18} color={colors.ink2} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t("reciters.search")}
                    placeholderTextColor={colors.ink2}
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    clearButtonMode="while-editing"
                    accessibilityLabel={t("reciters.search")}
                    style={[styles.searchInput, { color: colors.ink }]}
                />
            </View>
            <View style={styles.chips}>
                {FILTERS.map((value) => {
                    const selected = value === filter;
                    return (
                        <Pressable
                            key={value}
                            onPress={() => setFilter(value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[styles.chip, { backgroundColor: selected ? colors.mushaf : colors.surface2 }]}
                        >
                            <AppText variant="caption" color={selected ? colors.onMushaf : colors.ink2} style={styles.chipText}>
                                {filterLabel(value)}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
            <AppText variant="caption" muted>
                {t("reciters.hint")}
            </AppText>
        </View>
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("reciters.title") }} />
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={header}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                    <AppText muted style={[styles.empty, { padding: spacing.xl }]}>
                        {t("reciters.none", { query })}
                    </AppText>
                }
                renderSectionHeader={({ section }) => (
                    <AppText variant="label" muted style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs }} accessibilityRole="header">
                        {section.title}
                    </AppText>
                )}
                renderItem={({ item }) => {
                    const selected = item.id === reciterId;
                    const favourite = favouriteReciterIds.includes(item.id);
                    const previewing = previewReciterId === item.id;
                    return (
                        <View style={[styles.row, { marginHorizontal: spacing.sm, borderRadius: radius.lg, backgroundColor: selected ? colors.mushafSoft : "transparent" }]}>
                            <Pressable
                                style={styles.main}
                                onPress={() => {
                                    setReciterId(item.id);
                                    router.back();
                                }}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: selected }}
                                accessibilityLabel={`${item.name}, ${styleLabel(item)}`}
                            >
                                <ReciterTile reciter={item} selected={selected} />
                                <View style={styles.text}>
                                    <AppText variant="bodyStrong" numberOfLines={1}>
                                        {item.name}
                                    </AppText>
                                    <AppText variant="caption" muted numberOfLines={1}>
                                        {item.englishAudio ? `${styleLabel(item)} · ${t("reciters.englishAudio")}` : styleLabel(item)}
                                    </AppText>
                                </View>
                            </Pressable>
                            <Pressable
                                onPress={() => toggleFavouriteReciter(item.id)}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={t(favourite ? "reciters.unfavourite" : "reciters.favourite", { name: item.name })}
                                style={styles.icon}
                            >
                                <Ionicons name={favourite ? "star" : "star-outline"} size={20} color={favourite ? colors.brass : colors.ink2} />
                            </Pressable>
                            <Pressable
                                onPress={() => togglePreview(item.id)}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={t(previewing ? "reciters.stopPreview" : "reciters.preview")}
                                style={styles.icon}
                            >
                                <Ionicons name={previewing ? "stop-circle" : "play-circle-outline"} size={28} color={previewing ? colors.mushaf : colors.ink2} />
                            </Pressable>
                        </View>
                    );
                }}
            />
            <MiniPlayer safeBottom />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    chipText: { fontWeight: "600" },
    row: { flexDirection: "row", alignItems: "center", paddingRight: 6 },
    main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 10, minWidth: 0 },
    text: { flex: 1, minWidth: 0 },
    icon: { padding: 6 },
    empty: { textAlign: "center" },
});
