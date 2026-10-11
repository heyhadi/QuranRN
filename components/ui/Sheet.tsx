import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Modal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";

interface SheetProps {
    visible: boolean;
    onDismiss: () => void;
    title: string;
    children: React.ReactNode;
    /** Cap the height, as a fraction of the screen (content scrolls inside). */
    maxHeight?: `${number}%`;
}

/** A bottom sheet built on Paper's Modal, so no extra native module is needed. */
export function Sheet({ visible, onDismiss, title, children, maxHeight = "80%" }: SheetProps) {
    const { colors, radius, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                style={styles.modal}
                contentContainerStyle={[
                    styles.sheet,
                    {
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: radius.xl,
                        borderTopRightRadius: radius.xl,
                        paddingBottom: Math.max(insets.bottom, spacing.lg),
                        maxHeight,
                    },
                ]}
            >
                <View style={[styles.grab, { backgroundColor: colors.line }]} />
                <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
                    <AppText variant="title" style={styles.title} accessibilityRole="header">
                        {title}
                    </AppText>
                    <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
                        <AppText variant="title" muted>
                            ×
                        </AppText>
                    </Pressable>
                </View>
                {children}
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: { justifyContent: "flex-end", margin: 0 },
    sheet: { paddingTop: 8, width: "100%" },
    grab: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    title: { flex: 1 },
});
