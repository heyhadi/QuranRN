import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AyahProps {
    nomorAyat: number;
    teksArab: string;
    teksIndonesia: string;
    audioUrl?: string;
    onPlay?: () => void;
    isPlaying?: boolean;
}

const AyahCard: React.FC<AyahProps> = ({ nomorAyat, teksArab, teksIndonesia, audioUrl, onPlay, isPlaying }) => {
    return (
        <View
            style={[
                styles.ayahCard,
                isPlaying && styles.playingAyahCard, // Apply highlight style if playing
            ]}
        >
            <View style={styles.ayahHeader}>
                <Text style={styles.ayahNumber}>{nomorAyat}</Text>
                <Text style={styles.arabicText}>{teksArab}</Text>
            </View>
            <Text style={styles.translation}>{teksIndonesia}</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={onPlay}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Ionicons name="bookmark-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.tafsirButton]}>
                    <Text style={styles.tafsirText}>Tafsir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    ayahCard: {
        backgroundColor: "white",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    playingAyahCard: {
        // Style for the highlighted card
        backgroundColor: "#e6ffe6", // Light green background
        borderWidth: 2,
        borderColor: "#2ecc71",
    },
    ayahHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    ayahNumber: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#27ae60",
        marginRight: 8,
    },
    arabicText: {
        fontSize: 20,
        textAlign: "right",
        flex: 1,
        fontFamily: "AmiriQuran_400Regular",
    },
    translation: {
        fontSize: 16,
        color: "#333",
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
    },
    button: {
        backgroundColor: "#27ae60",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    tafsirButton: {
        backgroundColor: "#34495e",
    },
    tafsirText: {
        color: "white",
        fontSize: 14,
    },
});

export default AyahCard;
