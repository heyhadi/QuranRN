import React from "react";
import { Text } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { tajweedColorKey, type TajweedRuleId } from "@/constants/tajweed";
import type { TajweedSegment } from "@/services/tajweed";

interface TajweedTextProps {
    segments: TajweedSegment[];
    size: number;
    /** Called when a coloured letter is tapped. */
    onRulePress?: (rule: TajweedRuleId) => void;
}

/** Quran text with each tajweed rule in its own colour; coloured letters are tappable. */
export function TajweedText({ segments, size, onRulePress }: TajweedTextProps) {
    const { colors } = useTheme();
    return (
        <AppText variant="arabic" size={size}>
            {segments.map((segment, index) =>
                segment.rule ? (
                    <Text
                        key={index}
                        style={{ color: colors.tajweed[tajweedColorKey[segment.rule]] }}
                        onPress={onRulePress ? () => onRulePress(segment.rule!) : undefined}
                        accessibilityRole={onRulePress ? "button" : undefined}
                    >
                        {segment.text}
                    </Text>
                ) : (
                    segment.text
                ),
            )}
        </AppText>
    );
}
