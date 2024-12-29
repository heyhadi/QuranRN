import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSurahDetail, getTafsDetail } from "../../services/quranService"; // Path to your API service
import { Audio } from "expo-av";
import AyahCard from "@/components/AyahCard"; // Path to your AyahCard component
import { useNavigation } from "@react-navigation/native";
import useBookmarkStore from "@/store/store"; // Import the Zustand store
import Toast from "react-native-toast-message";
import { useSetAyahIndexStore } from "@/store/store";

import { Portal, Modal, Text as PaperText } from "react-native-paper";

interface SurahDetail {
    nomorAyat: number;
    teksArab: string;
    teksIndonesia: string;
    audio: string;
    isBookmarked: boolean;
    namaSurah: string;
    nomorSurah: number;
}

export default function Surah() {
    const route = useRouter();
    const navigation = useNavigation();
    const { id } = useLocalSearchParams();
    const [surah, setSurah] = useState<SurahDetail[]>([]); // Corrected type
    const [isLoading, setIsLoading] = useState(true);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number | null>(null);
    const flatListRef = useRef<FlatList<SurahDetail>>(null); // Corrected type
    const { bookmarks, addBookmark, removeBookmark } = useBookmarkStore(); // Access Zustand store
    const { currentIndex, setCurrentIndex } = useSetAyahIndexStore(); // Access and update currentIndex
    const [tafsirData, setTafsirData] = useState<any | null>(null);
    const [currentTafsir, setCurrentTafsir] = useState<any>(null);

    useEffect(() => {
        const fetchSurah = async () => {
            try {
                const surahData = await getSurahDetail(parseInt(Array.isArray(id) ? id[0] : id));
                const tafsirData = await getTafsDetail(parseInt(Array.isArray(id) ? id[0] : id));

                if (surahData && surahData.data && surahData.data.ayat) {
                    const transformedData = surahData.data.ayat.map((item: any, index: number) => ({
                        nomorAyat: item.no || index + 1, // Provide a fallback if no exists
                        teksArab: item.teksArab,
                        teksIndonesia: item.teksIndonesia,
                        audio: item.audio["01"],
                        isBookmarked: bookmarks.some((bookmark) => bookmark.nomorAyat === item.no || bookmark.nomorAyat === index + 1), // Check if ayah is bookmarked
                        namaSurah: surahData.data.namaLatin,
                        nomorSurah: surahData.data.nomor,
                    }));
                    setSurah(transformedData);
                    setTafsirData(tafsirData.data.tafsir);
                    navigation.setOptions({
                        title: surahData.data.namaLatin,
                        headerStyle: { backgroundColor: "green" },
                        headerTintColor: "white",
                        headerTitleStyle: { color: "white" },
                        headerBackTitleVisible: false,
                        headerBackTitle: "Go Back",
                    });

                    // Handle initial scroll if currentIndex is set
                    // Handle initial scroll if currentIndex is set
                    if (currentIndex !== null && flatListRef.current) {
                        // Use a slight delay to ensure FlatList is rendered before scrolling
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({
                                animated: true,
                                index: currentIndex,
                                viewOffset: 50,
                                viewPosition: 0.5,
                            });
                        }, 100); // Adjust delay as needed
                    }
                } else {
                    console.error("Invalid surah data:", surahData);
                }
            } catch (error) {
                console.error("Error fetching surah:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSurah();
    }, [id, currentIndex]); // Include currentIndex in the dependency array

    useEffect(() => {
        if (currentIndex !== null && flatListRef.current) {
            setTimeout(() => {
                try {
                    flatListRef.current?.scrollToIndex({
                        animated: true,
                        index: currentIndex,
                        viewOffset: 50,
                        viewPosition: 0.5,
                    });
                } catch (error) {
                    console.warn("Invalid index for FlatList scroll:", currentIndex);
                }
            }, 100);
        }
    }, [currentIndex]);

    useEffect(() => {
        if (surah.length && currentIndex !== null && flatListRef.current) {
            setTimeout(() => {
                try {
                    flatListRef.current?.scrollToIndex({
                        animated: true,
                        index: currentIndex - 1,
                        viewOffset: 50,
                        viewPosition: 0.5,
                    });
                } catch (error) {
                    console.warn("Invalid index for FlatList scroll:", currentIndex);
                }
            }, 100);
        }
    }, [currentIndex, surah]);

    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", () => {
            setCurrentIndex(null); // Reset currentIndex when leaving the screen
        });

        return unsubscribe;
    }, [navigation, setCurrentIndex]);

    useEffect(() => {
        if (currentAyahIndex !== null && flatListRef.current) {
            // Scroll to the currently playing ayah
            flatListRef.current.scrollToIndex({
                animated: true,
                index: currentAyahIndex,
                viewOffset: 50, // Adjust this value as needed
                viewPosition: 0.5,
            });
        }
    }, [currentAyahIndex]);

    const playSound = async (index: number) => {
        if (!surah || !surah.length || index < 0 || index >= surah.length) {
            return;
        }

        const ayah = surah[index];
        const audioUrl = ayah.audio;

        if (sound && currentAyahIndex === index) {
            sound.unloadAsync();
            setSound(null);
            setCurrentAyahIndex(null);
            return;
        }

        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
            setSound(newSound);
            setCurrentAyahIndex(index);
            await newSound.playAsync();

            newSound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    const nextIndex = index + 1;
                    if (nextIndex < surah.length) {
                        await newSound.unloadAsync();
                        playSound(nextIndex);
                    } else {
                        setSound(null);
                        setCurrentAyahIndex(null);
                    }
                }
            });
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="green" />
            </View>
        );
    }

    if (!surah) {
        return <Text>Error loading Surah.</Text>;
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={surah}
                ref={flatListRef} // Add the ref
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <AyahCard
                        nomorAyat={item.nomorAyat}
                        teksArab={item.teksArab}
                        teksIndonesia={item.teksIndonesia}
                        isBookmarked={item.isBookmarked} // Pass isBookmarked prop
                        onPlay={() => playSound(index)}
                        isPlaying={currentAyahIndex === index}
                        onBookmarkPress={() => {
                            if (item.isBookmarked) {
                                removeBookmark({ nomorAyat: item.nomorAyat, teksArab: item.teksArab, namaSurah: item.namaSurah, nomorSurah: item.nomorSurah });
                                Toast.show({
                                    text1: "Bookmark removed",
                                    text2: `Surah ${item.namaSurah}, Ayat  ${item.nomorAyat}`,
                                    type: "error", // Use 'error' for better consistency
                                    position: "top",
                                });
                            } else {
                                addBookmark(item);
                                Toast.show({
                                    text1: "Bookmark added",
                                    text2: `Surah ${item.namaSurah}, Ayat  ${item.nomorAyat}`,
                                    type: "success",
                                    position: "top",
                                });
                            }
                        }}
                        onTafsirPress={() => {
                            // Handle tafsir press triger modal
                            setCurrentTafsir(tafsirData[item.nomorAyat - 1].teks);
                        }}
                    />
                )}
            />
            <Toast />
            <Portal>
                <Modal
                    visible={currentTafsir}
                    onDismiss={() => setCurrentTafsir(null)}
                    contentContainerStyle={{
                        width: "80%",
                        backgroundColor: "white",
                        borderRadius: 8,
                        padding: 20,
                        alignSelf: "center",
                    }}
                >
                    <View style={{ padding: 20, backgroundColor: "white", borderRadius: 8 }}>
                        <PaperText>{currentTafsir}</PaperText>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}
