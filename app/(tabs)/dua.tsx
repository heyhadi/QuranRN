import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { useRouter } from "expo-router";
import { getSurahList } from "../../services/quranService"; // Import the service
import SurahCard from "../../components/Surahcard"; // Import the SurahCard component

export default function Home() {
    const router = useRouter();
    const [surahs, setSurahs] = useState(null); // Initialize as null for loading state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSurahs = async () => {
            const surahData = await getSurahList();
            console.log(surahData);

            if (surahData) {
                setSurahs(surahData.data);
            }
            setIsLoading(false);
        };

        fetchSurahs();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        ); // Show loading indicator
    }

    if (!surahs) {
        return <Text>Error loading Surahs.</Text>; // Handle error case
    }

    return (
        <View style={{
          marginTop: 20
        }}>
            <FlatList data={surahs} keyExtractor={(item) => item.nomor?.toString()} renderItem={({ item }) => <SurahCard number={item.nomor} name={item.nama} translation={item.arti} ayahCount={item.jumlahAyat} type={item.tempatTurun} namaLatin={item.namaLatin}/>} />
        </View>
    );
}
