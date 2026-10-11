import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import { bookmarkKey, sortBookmarks, useBookmarksStore, type Bookmark } from "@/store/bookmarks";
import { useCollectionsStore } from "@/store/collections";
import { useNotesStore } from "@/store/notes";

export default function BookmarksScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius, fonts } = useTheme();
    const bookmarksByKey = useBookmarksStore((state) => state.bookmarks);
    const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
    const collections = useCollectionsStore((state) => state.collections);
    const notes = useNotesStore((state) => state.notes);
    // "all" shows everything; otherwise only bookmarks filed in that collection.
    const [filter, setFilter] = useState<string>("all");
    const activeFilter = filter === "all" || collections.some((collection) => collection.id === filter) ? filter : "all";
    const bookmarks = useMemo(
        () => sortBookmarks(bookmarksByKey).filter((bookmark) => activeFilter === "all" || bookmark.collectionId === activeFilter),
        [bookmarksByKey, activeFilter],
    );

    const renderItem = ({ item }: { item: Bookmark }) => (
        <ReanimatedSwipeable
            friction={2}
            rightThreshold={60}
            overshootRight={false}
            renderRightActions={() => (
                <Pressable
                    onPress={() => removeBookmark(item.surahNumber, item.ayahNumber)}
                    accessibilityRole="button"
                    accessibilityLabel={t("saved.remove")}
                    style={[styles.delete, { backgroundColor: colors.danger, borderRadius: radius.lg }]}
                >
                    <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                    <AppText variant="caption" color="#FFFFFF">
                        {t("saved.remove")}
                    </AppText>
                </Pressable>
            )}
        >
            <Pressable
                onPress={() => router.push({ pathname: "/surah/[id]", params: { id: item.surahNumber, ayah: item.ayahNumber } })}
                accessibilityRole="button"
                accessibilityLabel={t("reader.bookmarkDetail", { surah: item.surahNameLatin, ayah: item.ayahNumber })}
                accessibilityActions={[{ name: "delete", label: t("saved.remove") }]}
                onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === "delete") removeBookmark(item.surahNumber, item.ayahNumber);
                }}
                style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.line, padding: spacing.lg }]}
            >
                <View style={styles.cardHeader}>
                    <StarNumber value={item.ayahNumber} size={32} />
                    <AppText variant="heading" style={styles.flex}>
                        {item.surahNameLatin}
                    </AppText>
                    {item.collectionId ? <View style={[styles.dot, { backgroundColor: collections.find((collection) => collection.id === item.collectionId)?.color ?? colors.brass }]} /> : null}
                    <AppText variant="caption" muted>
                        {`${item.surahNumber}:${item.ayahNumber}`}
                    </AppText>
                </View>
                <AppText style={[styles.arabic, { fontFamily: fonts.quran, color: colors.ink }]} numberOfLines={2}>
                    {item.textArabic}
                </AppText>
                {notes[bookmarkKey(item.surahNumber, item.ayahNumber)] ? (
                    <View style={[styles.note, { backgroundColor: colors.brassSoft, borderRadius: radius.sm }]}>
                        <Ionicons name="create-outline" size={14} color={colors.brass} />
                        <AppText variant="caption" numberOfLines={2} style={styles.flex} color={colors.ink}>
                            {notes[bookmarkKey(item.surahNumber, item.ayahNumber)].text}
                        </AppText>
                    </View>
                ) : null}
            </Pressable>
        </ReanimatedSwipeable>
    );

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <AppText variant="display" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }} accessibilityRole="header">
                {t("saved.title")}
            </AppText>
            {collections.length > 0 ? (
                <View style={[styles.filters, { paddingHorizontal: spacing.lg, paddingBottom: spacing.md }]}>
                    {[{ id: "all", name: t("home.tabAll"), color: colors.mushaf }, ...collections].map((collection) => {
                        const selected = collection.id === activeFilter;
                        return (
                            <Pressable
                                key={collection.id}
                                onPress={() => setFilter(collection.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                style={[styles.filterChip, { backgroundColor: selected ? collection.color : colors.surface2, borderRadius: radius.pill }]}
                            >
                                <AppText variant="caption" color={selected ? "#FFFFFF" : colors.ink2} style={styles.bold}>
                                    {collection.name}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
            {bookmarks.length > 0 ? (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => bookmarkKey(item.surahNumber, item.ayahNumber)}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}
                    ListFooterComponent={
                        <AppText variant="caption" muted style={styles.center}>
                            {t("saved.hint")}
                        </AppText>
                    }
                />
            ) : (
                <View style={[styles.empty, { padding: spacing.xxl }]}>
                    <Ionicons name="bookmark-outline" size={40} color={colors.brass} />
                    <AppText muted style={styles.center}>
                        {t("saved.empty")}
                    </AppText>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    bold: { fontWeight: "600" },
    note: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6 },
    card: { borderWidth: StyleSheet.hairlineWidth, gap: 8 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    arabic: { fontSize: 22, lineHeight: 44, textAlign: "right", writingDirection: "rtl" },
    delete: { width: 92, marginLeft: 10, alignItems: "center", justifyContent: "center", gap: 4 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    center: { textAlign: "center" },
});
