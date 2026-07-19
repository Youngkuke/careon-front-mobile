import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { CareEntrance, Screen, sharedStyles } from '@/components/careon/shared';
import { useChecklist } from '@/lib/checklist-state';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { SAVED_PROGRAMS } from '@/lib/mock-data';

function splitDeadline(deadline: string) {
  const match = deadline.match(/^(.*?)(\s*\([^)]+\))$/);

  if (!match) {
    return { date: deadline, weekday: '' };
  }

  return { date: match[1], weekday: match[2] };
}

export default function TodoScreen() {
  const { checkedDocuments, getDocumentKey, toggleDocument } = useChecklist();
  const totalDocuments = SAVED_PROGRAMS.reduce((total, program) => total + program.documents.length, 0);
  const completedDocuments = SAVED_PROGRAMS.reduce((total, program) => {
    return total + program.documents.filter((document) => checkedDocuments[getDocumentKey(program.id, document.title)]).length;
  }, 0);

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
        {SAVED_PROGRAMS.map((program, programIndex) => {
          const checkedCount = program.documents.filter((document) => checkedDocuments[getDocumentKey(program.id, document.title)]).length;
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
                  <Text style={styles.cardCount}>{checkedCount}/{program.documents.length}</Text>
                </View>

                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programAgency}>{program.agency}</Text>

                <View style={styles.documentList}>
                  {program.documents.map((document) => {
                    const key = getDocumentKey(program.id, document.title);
                    const checked = checkedDocuments[key];

                    return (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                        key={document.title}
                        onPress={() => toggleDocument(key)}
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
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(program.url)}
                  style={({ pressed }) => [styles.linkButton, pressed && styles.pressedLink]}>
                  <Text style={styles.linkText}>공식 페이지</Text>
                  <Ionicons color={CAREON_COLORS.text} name="open-outline" size={13} />
                </Pressable>
              </View>
            </CareEntrance>
          );
        })}
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
  documentList: {
    gap: 10,
    marginTop: 16,
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
