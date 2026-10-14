import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { AppText } from "@/components/ui/AppText";
import { OrnateCard } from "@/components/ui/Plate";
import { useTheme } from "@/components/useTheme";
import { learnLanguage, type HijaiyahLetter, type LearnLanguage } from "@/constants/hijaiyah";
import { buildQuiz, hasPassed, LEVEL_1, lessonById, readingRows, seededRandom, type QuizQuestion } from "@/services/learnRead";
import { fathahClipUri, hasFathahClip } from "@/services/learnReadAudio";
import { useAudioPlayerStore } from "@/store/audioPlayer";
import { useLearnReadStore } from "@/store/learnRead";

type Step = "letters" | "read" | "quiz" | "result";

/** Plays a syllable's clip, when one is bundled. Lessons show this only where audio exists. */
function PlayButton({ letter, size = 28 }: { letter: HijaiyahLetter; size?: number }) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const toggleClip = useAudioPlayerStore((state) => state.toggleClip);
    if (!hasFathahClip(letter.id)) return null;
    return (
        <Pressable
            onPress={async () => {
                const uri = await fathahClipUri(letter.id);
                if (uri) toggleClip(uri);
            }}
            accessibilityRole="button"
            accessibilityLabel={t("learn.listen", { sound: letter.sound.en })}
            hitSlop={8}
        >
            <Ionicons name="volume-high" size={size} color={colors.mushaf} />
        </Pressable>
    );
}

function LetterCard({ letter, language }: { letter: HijaiyahLetter; language: LearnLanguage }) {
    const { t } = useTranslation();
    const { colors, fonts, spacing } = useTheme();
    return (
        <OrnateCard style={[styles.letterCard, { padding: spacing.lg, gap: spacing.sm }]}>
            <View style={styles.letterRow}>
                <View style={styles.flex}>
                    <AppText variant="title">{letter.name[language]}</AppText>
                    <AppText variant="caption" muted>
                        {t("learn.letterAlone", { letter: letter.letter })}
                    </AppText>
                </View>
                <PlayButton letter={letter} />
            </View>
            <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]} accessibilityLabel={letter.sound[language]}>
                {letter.fathah}
            </AppText>
            <AppText variant="bodyStrong" color={colors.mushaf} style={styles.center}>
                {t("learn.readAs", { sound: letter.sound[language] })}
            </AppText>
        </OrnateCard>
    );
}

/** One reading row, right to left. Tap a syllable to check how it sounds. */
function ReadingRow({ row, language }: { row: HijaiyahLetter[]; language: LearnLanguage }) {
    const { colors, fonts, spacing, radius } = useTheme();
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    return (
        <View style={[styles.readingRow, { gap: spacing.sm }]}>
            {row.map((letter, index) => {
                const shown = revealed.has(index);
                return (
                    <Pressable
                        key={`${letter.id}-${index}`}
                        onPress={() => setRevealed((current) => new Set(current).add(index))}
                        accessibilityRole="button"
                        accessibilityLabel={shown ? letter.sound[language] : letter.fathah}
                        style={[styles.syllable, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md }]}
                    >
                        <AppText style={[styles.rowArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{letter.fathah}</AppText>
                        <AppText variant="caption" color={shown ? colors.mushaf : "transparent"}>
                            {letter.sound[language]}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

function Question({ question, language, onAnswer }: { question: QuizQuestion; language: LearnLanguage; onAnswer: (correct: boolean) => void }) {
    const { t } = useTranslation();
    const { colors, fonts, spacing, radius } = useTheme();
    const [picked, setPicked] = useState<string | null>(null);
    const readSound = question.kind === "readSound";

    return (
        <View style={{ gap: spacing.lg }}>
            <AppText variant="heading" style={styles.center}>
                {readSound ? t("learn.quizReadSound") : t("learn.quizFindLetter")}
            </AppText>
            <View style={styles.promptBox}>
                {readSound ? (
                    <AppText style={[styles.bigArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{question.answer.fathah}</AppText>
                ) : (
                    <View style={[styles.letterRow, styles.centerRow, { gap: spacing.md }]}>
                        <AppText style={[styles.bigSound, { color: colors.ink }]}>{question.answer.sound[language]}</AppText>
                        <PlayButton letter={question.answer} size={34} />
                    </View>
                )}
            </View>
            <View style={[styles.options, { gap: spacing.md }]}>
                {question.options.map((option) => {
                    const isAnswer = option.id === question.answer.id;
                    const isPicked = option.id === picked;
                    const background = picked === null ? colors.surface : isAnswer ? colors.mushafSoft : isPicked ? colors.surface2 : colors.surface;
                    const border = picked === null ? colors.line : isAnswer ? colors.mushaf : isPicked ? colors.danger : colors.line;
                    return (
                        <Pressable
                            key={option.id}
                            disabled={picked !== null}
                            onPress={() => setPicked(option.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isPicked }}
                            style={[styles.option, { backgroundColor: background, borderColor: border, borderRadius: radius.lg }]}
                        >
                            {readSound ? (
                                <AppText variant="title">{option.sound[language]}</AppText>
                            ) : (
                                <AppText style={[styles.optionArabic, { fontFamily: fonts.quran, color: colors.ink }]}>{option.fathah}</AppText>
                            )}
                        </Pressable>
                    );
                })}
            </View>
            {picked !== null ? (
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="bodyStrong" color={picked === question.answer.id ? colors.mushaf : colors.danger} style={styles.center}>
                        {picked === question.answer.id
                            ? t("learn.correct")
                            : t("learn.wrong", { syllable: question.answer.fathah, sound: question.answer.sound[language] })}
                    </AppText>
                    <Button mode="contained" onPress={() => onAnswer(picked === question.answer.id)}>
                        {t("learn.next")}
                    </Button>
                </View>
            ) : null}
        </View>
    );
}

/** A lesson: meet the new letters, read rows of them, then a short quiz. */
export default function LessonScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const { lesson: lessonId } = useLocalSearchParams<{ lesson: string }>();
    const lesson = lessonById(lessonId ?? "");
    const language = learnLanguage(i18n.language);
    const recordQuiz = useLearnReadStore((state) => state.recordQuiz);

    const [step, setStep] = useState<Step>("letters");
    // A new seed for every attempt, so a retried quiz asks in a different order.
    const [seed, setSeed] = useState(() => Date.now());
    const rows = useMemo(() => (lesson ? readingRows(lesson, seededRandom(seed)) : []), [lesson, seed]);
    const quiz = useMemo(() => (lesson ? buildQuiz(lesson, language, seededRandom(seed + 1)) : []), [lesson, language, seed]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [correct, setCorrect] = useState(0);

    if (!lesson) {
        return (
            <View style={[styles.screen, styles.centerBox, { backgroundColor: colors.paper }]}>
                <AppText muted>{t("learn.notFound")}</AppText>
            </View>
        );
    }

    const next = LEVEL_1.find((candidate) => candidate.number === lesson.number + 1);
    const passed = hasPassed(correct, quiz.length);

    const answer = (wasCorrect: boolean) => {
        const total = correct + (wasCorrect ? 1 : 0);
        setCorrect(total);
        if (questionIndex + 1 < quiz.length) {
            setQuestionIndex(questionIndex + 1);
            return;
        }
        recordQuiz(lesson.id, total, quiz.length);
        setStep("result");
    };

    const retry = () => {
        setSeed(Date.now());
        setQuestionIndex(0);
        setCorrect(0);
        setStep("quiz");
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.paper }]}>
            <Stack.Screen options={{ title: t("learn.lesson", { number: lesson.number }) }} />
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
                {step === "letters" ? (
                    <>
                        <AppText muted>{t("learn.lettersIntro", { count: lesson.letters.length })}</AppText>
                        {lesson.letters.map((letter) => (
                            <LetterCard key={letter.id} letter={letter} language={language} />
                        ))}
                        <Button mode="contained" onPress={() => setStep("read")}>
                            {t("learn.toReading")}
                        </Button>
                    </>
                ) : step === "read" ? (
                    <>
                        <AppText muted>{t("learn.readIntro")}</AppText>
                        {rows.map((row, index) => (
                            <ReadingRow key={`${seed}-${index}`} row={row} language={language} />
                        ))}
                        <Button mode="contained" onPress={() => setStep("quiz")}>
                            {t("learn.toQuiz")}
                        </Button>
                        <Button mode="text" onPress={() => setStep("letters")}>
                            {t("learn.backToLetters")}
                        </Button>
                    </>
                ) : step === "quiz" ? (
                    <>
                        <AppText variant="label" muted style={styles.center}>
                            {t("learn.questionOf", { current: questionIndex + 1, total: quiz.length })}
                        </AppText>
                        <Question key={`${seed}-${questionIndex}`} question={quiz[questionIndex]} language={language} onAnswer={answer} />
                    </>
                ) : (
                    <View style={{ gap: spacing.md }}>
                        <AppText variant="display" style={styles.center}>
                            {t("learn.score", { correct, total: quiz.length })}
                        </AppText>
                        <AppText style={styles.center} muted>
                            {passed ? t("learn.passed") : t("learn.notPassed", { needed: Math.ceil(quiz.length * 0.8) })}
                        </AppText>
                        {passed && next ? (
                            <Button mode="contained" onPress={() => router.replace({ pathname: "/learn/[lesson]", params: { lesson: next.id } })}>
                                {t("learn.nextLesson", { number: next.number })}
                            </Button>
                        ) : null}
                        {passed && !next ? <AppText variant="bodyStrong" style={styles.center}>{t("learn.levelDone")}</AppText> : null}
                        <Button mode={passed ? "outlined" : "contained"} onPress={retry}>
                            {t("learn.retry")}
                        </Button>
                        <Button mode="text" onPress={() => setStep("read")}>
                            {t("learn.practiseAgain")}
                        </Button>
                        <Button mode="text" onPress={() => router.back()}>
                            {t("learn.backToLessons")}
                        </Button>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    center: { textAlign: "center" },
    centerBox: { alignItems: "center", justifyContent: "center" },
    centerRow: { justifyContent: "center" },
    letterCard: {},
    letterRow: { flexDirection: "row", alignItems: "center" },
    // Amiri's marks sit high above the letter; the generous line height keeps the fathah from clipping.
    bigArabic: { fontSize: 96, lineHeight: 180, textAlign: "center", writingDirection: "rtl" },
    bigSound: { fontSize: 44, lineHeight: 56, fontWeight: "600" },
    promptBox: { alignItems: "center", justifyContent: "center", minHeight: 140 },
    readingRow: { flexDirection: "row-reverse", justifyContent: "center", flexWrap: "wrap" },
    syllable: { minWidth: 68, alignItems: "center", paddingHorizontal: 10, paddingBottom: 6, borderWidth: StyleSheet.hairlineWidth },
    rowArabic: { fontSize: 40, lineHeight: 80, writingDirection: "rtl" },
    options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
    option: { width: "46%", minHeight: 84, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
    optionArabic: { fontSize: 44, lineHeight: 88, writingDirection: "rtl" },
});
