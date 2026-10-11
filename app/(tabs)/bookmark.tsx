import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import { bookmarkKey, sortBookmarks, useBookmarksStore, type Bookmark } from "@/store/bookmarks";

export default function BookmarksScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, spacing, radius, fonts } = useTheme();
    const bookmarksByKey = useBookmarksStore((state) => state.bookmarks);
    const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
    const bookmarks = useMemo(() => sortBookmarks(bookmarksByKey), [bookmarksByKey]);

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
                    <AppText variant="caption" muted>
                        {`${item.surahNumber}:${item.ayahNumber}`}
                    </AppText>
                </View>
                <AppText style={[styles.arabic, { fontFamily: fonts.quran, color: colors.ink }]} numberOfLines={2}>
                    {item.textArabic}
                </AppText>
            </Pressable>
        </ReanimatedSwipeable>
    );

    return (
        <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.paper }]}>
            <AppText variant="display" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }} accessibilityRole="header">
                {t("saved.title")}
            </AppText>
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
    card: { borderWidth: StyleSheet.hairlineWidth, gap: 8 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    arabic: { fontSize: 22, lineHeight: 44, textAlign: "right", writingDirection: "rtl" },
    delete: { width: 92, marginLeft: 10, alignItems: "center", justifyContent: "center", gap: 4 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    center: { textAlign: "center" },
});
