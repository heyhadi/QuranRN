import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";

interface SheetProps {
    visible: boolean;
    onDismiss: () => void;
    title: string;
    children: React.ReactNode;
    /** Cap the height as a fraction of the screen; content scrolls inside. */
    maxHeightRatio?: number;
}

/**
 * A bottom sheet on React Native's own Modal: it always sits on the bottom edge and dims the whole
 * screen. (Paper's Modal adds safe-area margins that left it floating above the bottom.)
 */
export function Sheet({ visible, onDismiss, title, children, maxHeightRatio = 0.8 }: SheetProps) {
    const { colors, radius, spacing, scheme } = useTheme();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
                <Pressable
                    style={[StyleSheet.absoluteFill, { backgroundColor: scheme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" }]}
                    onPress={onDismiss}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                />
                <View
                    accessibilityViewIsModal
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: radius.xl,
                            borderTopRightRadius: radius.xl,
                            paddingBottom: Math.max(insets.bottom, spacing.lg),
                            maxHeight: height * maxHeightRatio,
                        },
                    ]}
                >
                    <View style={[styles.grab, { backgroundColor: colors.line }]} />
                    <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
                        <AppText variant="title" style={styles.title} accessibilityRole="header">
                            {title}
                        </AppText>
                        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.ink2} />
                        </Pressable>
                    </View>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    sheet: { paddingTop: 8, width: "100%" },
    grab: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12 },
    title: { flex: 1 },
});
