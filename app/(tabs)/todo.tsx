import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { CareEntrance, Screen, sharedStyles } from '@/components/careon/shared';
import { ApiError } from '@/lib/api';
import { useAppData } from '@/lib/app-data-state';
import { CAREON_COLORS } from '@/lib/careon-theme';

function splitDeadline(deadline: string) {
  const match = deadline.match(/^(.*?)(\s*\([^)]+\))$/);

  if (!match) {
    return { date: deadline, weekday: '' };
  }

  return { date: match[1], weekday: match[2] };
}

export default function TodoScreen() {
  const { answerExpiredPolicy, refreshData, todoPrograms, toggleTodo } = useAppData();
  const [answeringPolicyIds, setAnsweringPolicyIds] = useState<Record<number, boolean>>({});
  const totalDocuments = todoPrograms.reduce((total, program) => total + program.documents.length, 0);
  const completedDocuments = todoPrograms.reduce((total, program) => {
    return total + program.documents.filter((document) => document.isChecked).length;
  }, 0);

  useFocusEffect(
    useCallback(() => {
      refreshData().catch(() => undefined);
    }, [refreshData]),
  );

  const handleToggleTodo = async (todoId: number, isChecked: boolean) => {
    try {
      await toggleTodo(todoId, isChecked);
    } catch (error) {
      Alert.alert('저장 실패', error instanceof ApiError ? error.message : '체크 상태를 변경하지 못했어요.');
    }
  };

  const handleAnswerExpiredPolicy = async (savedPolicyId: number, applied: boolean) => {
    setAnsweringPolicyIds((current) => ({ ...current, [savedPolicyId]: true }));

    try {
      await answerExpiredPolicy(savedPolicyId, applied);
    } catch (error) {
      Alert.alert('저장 실패', error instanceof ApiError ? error.message : '신청 여부를 저장하지 못했어요.');
    } finally {
      setAnsweringPolicyIds((current) => ({ ...current, [savedPolicyId]: false }));
    }
  };

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>필요 서류 체크리스트</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressValue}>{completedDocuments}/{totalDocuments}</Text>
          <Text style={styles.progressLabel}>완료</Text>
        </View>
      </View>

      <View style={styles.sections}>
        {todoPrograms.length ? todoPrograms.map((program, programIndex) => {
          const checkedCount = program.documents.filter((document) => document.isChecked).length;
          const deadline = splitDeadline(program.deadline);

          return (
            <CareEntrance delay={80 + (programIndex * 70)} key={program.id}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.deadlinePill}>
                    <Text style={styles.deadlineText}>
                      {deadline.date}
                      {deadline.weekday ? <Text>{deadline.weekday}</Text> : null}
                    </Text>
                  </View>
                  <Text style={styles.cardCount}>
                    {program.isExpired ? '마감' : `${checkedCount}/${program.documents.length}`}
                  </Text>
                </View>

                <Text style={styles.programTitle}>{program.title}</Text>

                {program.isExpired ? (
                  <View style={styles.expiredBlock}>
                    <Text style={styles.expiredQuestion}>이 제도를 신청하셨나요?</Text>
                    <View style={styles.expiredActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={answeringPolicyIds[program.savedPolicyId]}
                        onPress={() => handleAnswerExpiredPolicy(program.savedPolicyId, true)}
                        style={({ pressed }) => [
                          styles.answerButton,
                          styles.yesButton,
                          pressed && styles.pressedAnswerButton,
                          answeringPolicyIds[program.savedPolicyId] && styles.disabledAnswerButton,
                        ]}>
                        <Text style={styles.yesButtonText}>예</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={answeringPolicyIds[program.savedPolicyId]}
                        onPress={() => handleAnswerExpiredPolicy(program.savedPolicyId, false)}
                        style={({ pressed }) => [
                          styles.answerButton,
                          styles.noButton,
                          pressed && styles.pressedAnswerButton,
                          answeringPolicyIds[program.savedPolicyId] && styles.disabledAnswerButton,
                        ]}>
                        <Text style={styles.noButtonText}>아니오</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.documentList}>
                    {program.documents.map((document) => {
                      const checked = document.isChecked;

                      return (
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked }}
                          key={document.todoId}
                          onPress={() => handleToggleTodo(document.todoId, !checked)}
                          style={({ pressed }) => [styles.checkLine, pressed && styles.pressedCheckLine]}>
                          <View style={[styles.checkbox, checked && styles.checkedBox]}>
                            <Ionicons
                              color={checked ? CAREON_COLORS.background : CAREON_COLORS.primary}
                              name="checkmark"
                              size={checked ? 17 : 15}
                            />
                          </View>
                          <View style={styles.checkText}>
                            <Text style={[styles.checkTitle, checked && styles.checkedText]}>{document.title}</Text>
                            <Text style={[styles.checkGuide, checked && styles.checkedGuide]}>{document.guide}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {program.sourceUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => Linking.openURL(program.sourceUrl)}
                    style={({ pressed }) => [styles.linkButton, pressed && styles.pressedLink]}>
                    <Text style={styles.linkText}>공식 페이지</Text>
                    <Ionicons color={CAREON_COLORS.text} name="open-outline" size={13} />
                  </Pressable>
                ) : null}
              </View>
            </CareEntrance>
          );
        }) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>준비할 서류가 없어요.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: CAREON_COLORS.title,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 28,
  },
  progressBadge: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 18,
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...sharedStyles.cardShadow,
  },
  progressValue: {
    color: CAREON_COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  progressLabel: {
    color: CAREON_COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    marginTop: 2,
  },
  sections: {
    gap: 18,
    marginTop: 28,
  },
  card: {
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 20,
    padding: 18,
    ...sharedStyles.cardShadow,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deadlinePill: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deadlineText: {
    color: CAREON_COLORS.title,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  cardCount: {
    color: CAREON_COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  programTitle: {
    color: CAREON_COLORS.title,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 16,
  },
  programAgency: {
    color: CAREON_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 5,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 20,
    minHeight: 96,
    justifyContent: 'center',
    ...sharedStyles.cardShadow,
  },
  emptyText: {
    color: CAREON_COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  documentList: {
    gap: 10,
    marginTop: 16,
  },
  expiredBlock: {
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 14,
    gap: 14,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  expiredQuestion: {
    color: CAREON_COLORS.title,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  expiredActions: {
    flexDirection: 'row',
    gap: 10,
  },
  answerButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  yesButton: {
    backgroundColor: CAREON_COLORS.primary,
  },
  noButton: {
    backgroundColor: CAREON_COLORS.background,
    borderColor: CAREON_COLORS.line,
    borderWidth: 1,
  },
  pressedAnswerButton: {
    opacity: 0.75,
  },
  disabledAnswerButton: {
    opacity: 0.55,
  },
  yesButtonText: {
    color: CAREON_COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },
  noButtonText: {
    color: CAREON_COLORS.text,
    fontSize: 14,
    fontWeight: '900',
  },
  checkLine: {
    alignItems: 'flex-start',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pressedCheckLine: {
    opacity: 0.7,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderColor: CAREON_COLORS.primary,
    borderRadius: 7,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginTop: 0,
    width: 24,
  },
  checkedBox: {
    backgroundColor: CAREON_COLORS.primary,
  },
  checkText: {
    flex: 1,
    gap: 5,
  },
  checkTitle: {
    color: CAREON_COLORS.title,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  checkGuide: {
    color: CAREON_COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  checkedText: {
    color: CAREON_COLORS.muted,
    textDecorationLine: 'line-through',
  },
  checkedGuide: {
    color: CAREON_COLORS.faint,
    textDecorationLine: 'line-through',
  },
  linkButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    marginTop: 14,
    paddingVertical: 4,
  },
  pressedLink: {
    opacity: 0.7,
  },
  linkText: {
    color: CAREON_COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
});
