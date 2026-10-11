import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { StarNumber } from "@/components/ui/StarNumber";
import { useTheme } from "@/components/useTheme";
import { BISMILLAH } from "@/constants/surahPages";
import { tajweedColorKey, type TajweedRuleId } from "@/constants/tajweed";
import type { MushafLine, MushafWord } from "@/services/mushaf";
import { useMushafPage, useSurahList } from "@/services/queries";

/** The pages have fifteen lines; a line is justified only when its words already fill most of the width. */
export const LINES_PER_PAGE = 15;
const JUSTIFY_FROM = 0.8;
const FIT_MARGIN = 0.985;
/** A line of ordinary words is about this many font sizes wide in Amiri; tuned on real pages. */
const FONT_FROM_WIDTH = 15;

interface TextLineProps {
    words: MushafWord[];
    width: number;
    height: number;
    fontSize: number;
    /** Colour the letters by tajweed rule. */
    tajweed: boolean;
    onWordPress: (word: MushafWord) => void;
    onRulePress: (rule: TajweedRuleId) => void;
}

/**
 * One line of the page. The words are measured at the base size first: a line that is too wide is
 * shrunk to fit, one that nearly fills the width is spread edge to edge like printed text, and a short
 * line (the end of a Surah) stays centred.
 */
function TextLine({ words, width, height, fontSize, tajweed, onWordPress, onRulePress }: TextLineProps) {
    const { colors, fonts } = useTheme();
    const [natural, setNatural] = useState<number | null>(null);
    // A hair under the exact fit, because glyph widths do not scale perfectly linearly.
    const fit = natural !== null && natural > width * FIT_MARGIN ? (width * FIT_MARGIN) / natural : 1;
    const size = fontSize * fit;
    const justify = natural !== null && natural * fit >= width * JUSTIFY_FROM;

    const renderWords = (wordSize: number) =>
        words.map((word, index) =>
            word.isEnd ? (
                <View key={index} style={{ marginHorizontal: wordSize * 0.1, flexShrink: 0 }}>
                    <StarNumber value={word.ayahNumber} size={wordSize * 1.05} />
                </View>
            ) : (
                <Text
                    key={index}
                    numberOfLines={1}
                    onPress={() => onWordPress(word)}
                    style={{ fontFamily: fonts.quran, fontSize: wordSize, lineHeight: wordSize * 1.75, color: colors.ink, marginHorizontal: wordSize * 0.1, includeFontPadding: false, flexShrink: 0 }}
                >
                    {tajweed && word.segments
                        ? word.segments.map((segment, part) =>
                              segment.rule ? (
                                  <Text key={part} style={{ color: colors.tajweed[tajweedColorKey[segment.rule]] }} onPress={() => onRulePress(segment.rule!)}>
                                      {segment.text}
                                  </Text>
                              ) : (
                                  segment.text
                              ),
                          )
                        : word.text}
                </Text>
            ),
        );

    return (
        <View style={{ width, height, justifyContent: "center" }}>
            {/* The same words at the base size, invisible, just to learn how wide they are. */}
            <View pointerEvents="none" style={{ position: "absolute", width: width * 3, opacity: 0 }}>
                <View onLayout={(event) => setNatural(event.nativeEvent.layout.width)} style={styles.natural}>
                    {renderWords(fontSize)}
                </View>
            </View>
            <View style={[styles.line, { justifyContent: justify ? "space-between" : "center" }]}>{renderWords(size)}</View>
        </View>
    );
}

/** The Surah title: the name between two brass rules that end in diamonds, like an open banner. */
function TitleLine({ surahNumber, width, height, fontSize }: { surahNumber: number; width: number; height: number; fontSize: number }) {
    const { colors, fonts } = useTheme();
    const surahs = useSurahList();
    const name = surahs.data?.find((surah) => surah.number === surahNumber)?.nameArabic;
    return (
        <View style={[styles.banner, { width, height }]}>
            <View style={[styles.diamond, { backgroundColor: colors.brass }]} />
            <View style={[styles.rule, { borderTopColor: colors.brass }]} />
            <Text style={{ fontFamily: fonts.quranBold, fontSize: fontSize * 1.25, lineHeight: fontSize * 2.2, color: colors.brass, includeFontPadding: false, paddingHorizontal: 12 }} accessibilityRole="header">
                {name ?? ""}
            </Text>
            <View style={[styles.rule, { borderTopColor: colors.brass }]} />
            <View style={[styles.diamond, { backgroundColor: colors.brass }]} />
        </View>
    );
}

interface MushafPageViewProps {
    pageNumber: number;
    width: number;
    height: number;
    tajweed: boolean;
    onWordPress: (word: MushafWord) => void;
    onRulePress: (rule: TajweedRuleId) => void;
}

/** One page of the Madani mushaf at the given size. */
export function MushafPageView({ pageNumber, width, height, tajweed, onWordPress, onRulePress }: MushafPageViewProps) {
    const { t } = useTranslation();
    const { colors, fonts } = useTheme();
    const page = useMushafPage(pageNumber);
    const lineHeight = height / LINES_PER_PAGE;
    const fontSize = Math.min(width / FONT_FROM_WIDTH, lineHeight * 0.62);

    if (page.isPending) {
        return (
            <View style={[styles.center, { width, height }]}>
                <ActivityIndicator size="large" color={colors.mushaf} />
            </View>
        );
    }
    if (page.isError) {
        return (
            <View style={[styles.center, { width, height, gap: 12 }]}>
                <AppText style={styles.centerText}>{t("mushaf.loadError")}</AppText>
                <Button mode="contained" onPress={() => page.refetch()}>
                    {t("common.tryAgain")}
                </Button>
            </View>
        );
    }

    const renderLine = (line: MushafLine) => {
        if (line.kind === "text") return <TextLine key={line.lineNumber} words={line.words} width={width} height={lineHeight} fontSize={fontSize} tajweed={tajweed} onWordPress={onWordPress} onRulePress={onRulePress} />;
        if (line.kind === "header") return <TitleLine key={line.lineNumber} surahNumber={line.surahNumber} width={width} height={lineHeight} fontSize={fontSize} />;
        return (
            <View key={line.lineNumber} style={{ width, height: lineHeight, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.quran, fontSize: fontSize * 1.05, color: colors.ink, includeFontPadding: false }}>{BISMILLAH}</Text>
            </View>
        );
    };

    return <View style={{ width, height, justifyContent: page.data.lines.length < LINES_PER_PAGE ? "center" : "flex-start" }}>{page.data.lines.map(renderLine)}</View>;
}

const styles = StyleSheet.create({
    center: { alignItems: "center", justifyContent: "center" },
    centerText: { textAlign: "center" },
    natural: { flexDirection: "row-reverse", alignSelf: "flex-start" },
    line: { flexDirection: "row-reverse", alignItems: "center" },
    banner: { flexDirection: "row", alignItems: "center", gap: 8 },
    rule: { flex: 1, borderTopWidth: 1, opacity: 0.8 },
    diamond: { width: 8, height: 8, transform: [{ rotate: "45deg" }] },
});

