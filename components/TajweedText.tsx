import React, { useMemo } from "react";
import { Platform, Text } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { tajweedColorKey, type TajweedRuleId } from "@/constants/tajweed";
import { shapeSafe, type TajweedSegment } from "@/services/tajweed";

/** On Android the coloured runs are re-cut so letters stay joined and marks stay on their letters (see shapeSafe). */
export function displaySegments(segments: TajweedSegment[]): TajweedSegment[] {
    return Platform.OS === "android" ? shapeSafe(segments) : segments;
}

interface TajweedTextProps {
    segments: TajweedSegment[];
    size: number;
    /** Called when a coloured letter is tapped. */
    onRulePress?: (rule: TajweedRuleId) => void;
}

/** Quran text with each tajweed rule in its own colour; coloured letters are tappable. */
export function TajweedText({ segments, size, onRulePress }: TajweedTextProps) {
    const { colors } = useTheme();
    const shown = useMemo(() => displaySegments(segments), [segments]);
    return (
        <AppText variant="arabic" size={size}>
            {shown.map((segment, index) =>
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
