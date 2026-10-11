import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import SurahCard from "@/components/Surahcard";
import { useSurahList } from "@/services/queries";
import { filterSurahs } from "@/services/surahSearch";
import { useReadingProgressStore } from "@/store/readingProgress";

export default function Home() {
    const { data: surahs, isPending, isError, refetch } = useSurahList();
    const [searchQuery, setSearchQuery] = useState("");
    const lastRead = useReadingProgressStore((state) => state.lastRead);

    const filteredSurahs = useMemo(() => (surahs ? filterSurahs(surahs, searchQuery) : []), [surahs, searchQuery]);

    if (isPending) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="green" />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Couldn't load the Surah list. Check your connection and try again.</Text>
                <Button mode="contained" buttonColor="green" onPress={() => refetch()}>
                    Try again
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TextInput
                label="Search Surahs"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Name, meaning or number"
                // Surah names are transliterations; autocorrect turns "kahf" into "Kahn".
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                mode="outlined"
                style={styles.textInput}
                theme={{ colors: { primary: "#27ae60", background: "#FFFFFF" } }}
            />
            <FlatList
                data={filteredSurahs}
                keyExtractor={(item) => item.number.toString()}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    lastRead && !searchQuery ? (
                        <Link href={{ pathname: "/surah/[id]", params: { id: lastRead.surahNumber, ayah: lastRead.ayahNumber } }} asChild>
                            <Pressable style={styles.continueCard} accessibilityRole="button">
                                <Text style={styles.continueLabel}>Continue reading</Text>
                                <Text style={styles.continueTitle}>
                                    {lastRead.surahNameLatin} · Ayah {lastRead.ayahNumber}
                                </Text>
                            </Pressable>
                        </Link>
                    ) : null
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No Surah matches "{searchQuery}".</Text>}
                renderItem={({ item }) => (
                    <Link href={{ pathname: "/surah/[id]", params: { id: item.number } }} asChild>
                        <Pressable accessibilityRole="button">
                            <SurahCard
                                number={item.number}
                                name={item.nameArabic}
                                translation={item.meaning}
                                ayahCount={item.ayahCount}
                                type={item.revelationPlace}
                                namaLatin={item.nameLatin}
                            />
                        </Pressable>
                    </Link>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        textAlign: "center",
    },
    textInput: {
        marginHorizontal: 20,
        marginBottom: 10,
        marginTop: 10,
        backgroundColor: "white",
        borderRadius: 8,
    },
    continueCard: {
        backgroundColor: "green",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    continueLabel: {
        color: "#ffffffcc",
        fontSize: 13,
    },
    continueTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 2,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 32,
        fontSize: 16,
        color: "#777777",
    },
});
