import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator, findNodeHandle } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSurahDetail } from "../../services/quranService"; // Path to your API service
import { Audio } from "expo-av";
import AyahCard from "@/components/AyahCard"; // Path to your AyahCard component
import { useNavigation } from "@react-navigation/native";
import { useAudio } from '@/components/AudioContext'

interface SurahDetail {
    nomorAyat: number;
    teksArab: string;
    teksIndonesia: string;
    audio: string;
}

export default function Surah() {
    const route = useRouter();
    const navigation = useNavigation();
    const { id } = useLocalSearchParams();
    const [surah, setSurah] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentAyahIndex, setCurrentAyahIndex] = useState<number | null>(null);
    const flatListRef = useRef<FlatList<any>>(null);

    useEffect(() => {
        const fetchSurah = async () => {
            try {
                const surahData = await getSurahDetail(parseInt(Array.isArray(id) ? id[0] : id));
                if (surahData && surahData.data && surahData.data.ayat) {
                    const transformedData = surahData.data.ayat.map((item: any, index: number) => ({
                        nomorAyat: item.no || index + 1, // Provide a fallback if no exists
                        teksArab: item.teksArab,
                        teksIndonesia: item.teksIndonesia,
                        audio: item.audio["01"],
                    }));
                    setSurah(transformedData);
                    navigation.setOptions({
                        title: surahData.data.namaLatin,
                        headerStyle: { backgroundColor: "green" },
                        headerTintColor: "white",
                        headerTitleStyle: { color: "white" },
                        headerBackTitleVisible: false,
                        headerBackTitle: "Go Back", 
                    });
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
    }, [id]);


    useEffect(() => {
        if (currentAyahIndex !== null && flatListRef.current) {
            // Scroll to the currently playing ayah
            flatListRef.current.scrollToIndex({
                animated: true,
                index: currentAyahIndex,
                viewOffset: 50, // Adjust this value as needed
                viewPosition: 0.5
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
        <View style={{flex: 1, marginTop: 20}}>
            <FlatList
                data={surah}
                ref={flatListRef} // Add the ref
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <AyahCard
                        nomorAyat={item.nomorAyat}
                        teksArab={item.teksArab}
                        teksIndonesia={item.teksIndonesia}
                        onPlay={() => playSound(index)}
                        isPlaying={currentAyahIndex === index}
                    />
                )}
            />
        </View>
    );
}