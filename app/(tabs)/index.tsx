import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter, Link } from "expo-router";
import { TextInput } from "react-native-paper";
import { getSurahList } from "../../services/quranService";
import SurahCard from "../../components/Surahcard";
import { StyleSheet } from 'react-native';

// Define the Surah type (crucial for type safety)
interface Surah {
    nomor: number;
    nama: string;
    arti: string;
    jumlahAyat: number;
    tempatTurun: string;
    namaLatin: string;
    // Add other properties as needed
}

export default function Home() {
    const router = useRouter();
    const [surahs, setSurahs] = useState<Surah[] | null>(null); // Correctly typed state
    const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchSurahs = async () => {
            const surahData = await getSurahList();

            if (surahData && surahData.data) {
                // Check if data and data.data exist
                setSurahs(surahData.data);
                setFilteredSurahs(surahData.data);
            } else {
                console.error("Invalid surah data received:", surahData);
                // Handle the error appropriately, e.g., display an error message to the user
            }
            setIsLoading(false);
        };

        fetchSurahs();
    }, []);

    const handleSearch = (text: string) => {
        // Type the text parameter
        setSearchQuery(text);
        if (surahs) {
            // Check if surahs is not null before filtering
            const filteredData = surahs.filter((surah) => {
                console.log(surah);

                return surah.namaLatin.toLowerCase().includes(text.toLowerCase());
            });
            console.log(filteredData);

            setFilteredSurahs(filteredData);
        } else {
            setFilteredSurahs([]);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (!surahs) {
        return <Text>Error loading Surahs.</Text>;
    }

    return (
        <View style={{}}>
            <TextInput
                label="Search Surahs"
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Enter Surah name"
                mode="outlined" // Use outlined mode for a cleaner look
                style={styles.textInput}
                theme={{
                    colors: {
                        primary: "#27ae60", // Green primary color
                        background: "#FFFFFF",
                    },
                }}
            />
            <FlatList
                data={filteredSurahs}
                keyExtractor={(item) => item.nomor.toString()}
                renderItem={({ item }) => (
                    <Link href={`/surah/${item.nomor}`} asChild>
                        <TouchableOpacity>
                            <SurahCard number={item.nomor} name={item.nama} translation={item.arti} ayahCount={item.jumlahAyat} type={item.tempatTurun} namaLatin={item.namaLatin} />
                        </TouchableOpacity>
                    </Link>
                )}
            />
        </View>
    );

    
}


const styles = StyleSheet.create({
  textInput: {
      marginHorizontal: 20,
      marginBottom: 10,
      marginTop: 10,
      backgroundColor: 'white', // Ensure background is white for contrast
      borderRadius: 8, // Add some border radius
  },
});
