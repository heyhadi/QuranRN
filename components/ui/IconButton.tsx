import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/components/useTheme";

interface IconButtonProps {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    onPress: () => void;
    accessibilityLabel: string;
    /** Solid green, for the main action. */
    primary?: boolean;
    color?: string;
    size?: number;
    disabled?: boolean;
}

export function IconButton({ icon, onPress, accessibilityLabel, primary, color, size = 36, disabled }: IconButtonProps) {
    const { colors } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled }}
            hitSlop={6}
            style={({ pressed }) => [
                styles.button,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: primary ? colors.mushaf : colors.surface2,
                    opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
                },
            ]}
        >
            <Ionicons name={icon} size={size * 0.5} color={color ?? (primary ? colors.onMushaf : colors.ink)} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { alignItems: "center", justifyContent: "center" },
});
