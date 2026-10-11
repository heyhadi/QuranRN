import { Link } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { bookmarkKey, sortBookmarks, useBookmarksStore, type Bookmark } from "@/store/bookmarks";

const BookmarksScreen = () => {
    const bookmarksByKey = useBookmarksStore((state) => state.bookmarks);
    const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
    const bookmarks = useMemo(() => sortBookmarks(bookmarksByKey), [bookmarksByKey]);

    const renderItem = ({ item }: { item: Bookmark }) => (
        <Link href={{ pathname: "/surah/[id]", params: { id: item.surahNumber, ayah: item.ayahNumber } }} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityHint="Long press to remove this bookmark"
                onLongPress={() => removeBookmark(item.surahNumber, item.ayahNumber)}
            >
                <View style={styles.bookmarkCard}>
                    <View style={styles.numberContainer}>
                        <Text style={styles.number}>{item.surahNumber}</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.latinText}>
                            {item.surahNameLatin} · Ayah {item.ayahNumber}
                        </Text>
                        <Text style={styles.arabicText} numberOfLines={1}>
                            {item.textArabic}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Link>
    );

    return (
        <View style={styles.container}>
            {bookmarks.length > 0 ? (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => bookmarkKey(item.surahNumber, item.ayahNumber)}
                    renderItem={renderItem}
                    ListFooterComponent={<Text style={styles.hintText}>Long press a bookmark to remove it.</Text>}
                />
            ) : (
                <Text style={styles.noBookmarksText}>No bookmarks yet. Tap the bookmark icon on any ayah to save it here.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 16,
    },
    bookmarkCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        marginHorizontal: 16,
    },
    numberContainer: {
        backgroundColor: "#E0F2F7",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    number: {
        fontSize: 16,
        fontWeight: "bold",
        color: "green",
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    arabicText: {
        fontSize: 20,
        textAlign: "right",
        fontFamily: "AmiriQuran_400Regular",
        writingDirection: "rtl",
    },
    latinText: {
        fontSize: 15,
        fontWeight: "600",
    },
    noBookmarksText: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 32,
        marginHorizontal: 32,
        color: "#777777",
    },
    hintText: {
        fontSize: 13,
        textAlign: "center",
        color: "#777777",
        marginTop: 8,
    },
});

export default BookmarksScreen;
