import React, { useMemo } from "react";
import { Text } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/components/useTheme";
import { parseTranslation } from "@/services/richText";

interface TranslationTextProps {
    /** A translation as quran.com sends it: HTML with <sup foot_note=…> markers. */
    html: string;
    onFootnotePress?: (footnoteId: number) => void;
}

/** An English translation with its footnote numbers as small tappable markers. */
export function TranslationText({ html, onFootnotePress }: TranslationTextProps) {
    const { colors } = useTheme();
    const segments = useMemo(() => parseTranslation(html), [html]);
    return (
        <AppText style={{ fontSize: 15, lineHeight: 24 }}>
            {segments.map((segment, index) => {
                if (segment.footnoteId !== undefined) {
                    return (
                        <Text
                            key={index}
                            onPress={() => onFootnotePress?.(segment.footnoteId!)}
                            accessibilityRole="button"
                            accessibilityLabel={`Footnote ${segment.text}`}
                            style={{ color: colors.brass, fontSize: 11, fontWeight: "700" }}
                        >
                            {` ${segment.text} `}
                        </Text>
                    );
                }
                return segment.italic ? (
                    <Text key={index} style={{ fontStyle: "italic" }}>
                        {segment.text}
                    </Text>
                ) : (
                    segment.text
                );
            })}
        </AppText>
    );
}
