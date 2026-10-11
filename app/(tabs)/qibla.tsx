import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useQiblaDirection } from "@/components/useQiblaDirection";
import { arrowRotation, compassPoint } from "@/services/qibla";

export default function Qibla() {
    const qibla = useQiblaDirection();

    if (qibla.status === "loading") {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="green" />
                <Text style={styles.hint}>Finding your location…</Text>
            </View>
        );
    }

    if (qibla.status === "permission-denied") {
        return (
            <View style={styles.centered}>
                <Text style={styles.message}>Wird needs your location to work out the Qibla direction.</Text>
                <Button mode="contained" buttonColor="green" onPress={() => Linking.openSettings()}>
                    Open Settings
                </Button>
            </View>
        );
    }

    if (qibla.status === "error") {
        return (
            <View style={styles.centered}>
                <Text style={styles.message}>Couldn't get your location. Make sure location services are on, then reopen this tab.</Text>
            </View>
        );
    }

    const { bearing, heading } = qibla;
    const rotation = heading === null ? 0 : arrowRotation(bearing, heading);
    const isFacingQibla = heading !== null && (rotation < 5 || rotation > 355);

    return (
        <View style={styles.centered}>
            <View style={[styles.dial, isFacingQibla && styles.dialAligned]}>
                <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
                    <Ionicons name="navigate" size={96} color={isFacingQibla ? "green" : "#333333"} style={styles.arrow} />
                </View>
            </View>
            <Text style={styles.bearing}>
                {Math.round(bearing)}° {compassPoint(bearing)}
            </Text>
            <Text style={styles.hint}>
                {heading === null
                    ? "Waiting for the compass…"
                    : isFacingQibla
                      ? "You are facing the Qibla."
                      : "Turn until the arrow points straight up. Hold the phone flat, away from metal."}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        gap: 16,
    },
    dial: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 3,
        borderColor: "#dddddd",
        justifyContent: "center",
        alignItems: "center",
    },
    dialAligned: {
        borderColor: "green",
    },
    // The "navigate" icon points up and to the right; turn it so 0° points straight up.
    arrow: {
        transform: [{ rotate: "-45deg" }],
    },
    bearing: {
        fontSize: 28,
        fontWeight: "bold",
    },
    message: {
        fontSize: 16,
        textAlign: "center",
    },
    hint: {
        fontSize: 15,
        textAlign: "center",
        color: "#555555",
    },
});
