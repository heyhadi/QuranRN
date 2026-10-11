import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";

interface Option<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
    const { colors, radius } = useTheme();
    return (
        <View
            style={[styles.track, { backgroundColor: colors.surface2, borderRadius: radius.md }]}
            accessibilityRole="tablist"
            accessibilityLabel={accessibilityLabel}
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        style={[
                            styles.segment,
                            { borderRadius: radius.sm },
                            selected && { backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
                        ]}
                    >
                        <AppText variant="bodyStrong" style={styles.text} color={selected ? colors.ink : colors.ink2}>
                            {option.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: { flexDirection: "row", padding: 3, gap: 3 },
    segment: { flex: 1, alignItems: "center", paddingVertical: 7 },
    text: { fontSize: 14 },
});
