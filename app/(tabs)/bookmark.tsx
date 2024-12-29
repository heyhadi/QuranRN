import React from "react";
import useBookmarksStore from "@/store/store";
import { FlatList, StyleSheet, Text, View, TouchableOpacity} from "react-native";
import { useRouter, Link } from "expo-router";
import { useSetAyahIndexStore } from "@/store/store";

const BookmarksScreen = () => {
    const { bookmarks }: { bookmarks: { nomorAyat: number; teksArab: string; namaSurah: string; nomorSurah:number}[] } = useBookmarksStore();
    const {currentIndex, setCurrentIndex} = useSetAyahIndexStore();

    const renderItem = ({ item }: { item: { nomorAyat: number; teksArab: string; namaSurah: string; nomorSurah:number } }) => (
        <Link href={`/surah/${item.nomorSurah}`} asChild >
            <TouchableOpacity onPress={() => { setCurrentIndex(item.nomorAyat)}}>
                <View style={styles.bookmarkCard} >
                    <View style={styles.numberContainer}>
                        <Text style={styles.number}>{item.nomorSurah}</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.arabicText}>{item.namaSurah}</Text>
                        <Text style={styles.latinText}>{"Ayat" + " " + item.nomorAyat}</Text>
                        {/* ... display other ayah details if needed ... */}
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );

    return <View style={styles.container}>{bookmarks.length > 0 ? <FlatList data={bookmarks} renderItem={renderItem} /> : <Text style={styles.noBookmarksText}>No bookmarks yet.</Text>}</View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    bookmarkCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF", // White background
        borderRadius: 16, // Rounded corners
        padding: 16, // Padding inside the card
        marginBottom: 8, // Spacing between cards
        elevation: 3, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        marginHorizontal: 16, // Add horizontal margin
    },
    numberContainer: {
        backgroundColor: "#E0F2F7", // Light blue background for number
        borderRadius: 20, // Circular shape
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16, // Spacing between number and text
    },
    number: {
        fontSize: 16,
        fontWeight: "bold",
        color: "green", // Blue color for number
    },
    textContainer: {
        flex: 1, // Allow text to take up available space
    },
    arabicText: {
        fontSize: 18,
        textAlign: "right",
    },
    latinText: {
        fontSize: 16,
        textAlign: "right",
    },
    noBookmarksText: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 32,
    },
});

export default BookmarksScreen;
