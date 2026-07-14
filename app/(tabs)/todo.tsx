import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/careon/shared';
import { useChecklist } from '@/lib/checklist-state';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { SAVED_PROGRAMS } from '@/lib/mock-data';

export default function TodoScreen() {
  const { checkedDocuments, getDocumentKey, toggleDocument } = useChecklist();

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.title}>신청 일정</Text>

      <View style={styles.sections}>
        {SAVED_PROGRAMS.map((program) => (
          <View key={program.id} style={styles.section}>
            <Text style={styles.date}>{program.deadline}</Text>
            <View style={styles.card}>
              <Text style={styles.programTitle}>{program.title}</Text>
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
                        {checked ? <Ionicons color={CAREON_COLORS.background} name="checkmark" size={13} /> : null}
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
                hitSlop={10}
                onPress={() => Linking.openURL(program.url)}
                style={styles.linkWrap}>
                <Text style={styles.linkText}>제도 공식 페이지 바로가기</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 26,
    paddingTop: 31,
  },
  title: {
    color: CAREON_COLORS.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  sections: {
    gap: 25,
    marginTop: 38,
  },
  section: {
    gap: 14,
  },
  date: {
    color: CAREON_COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
    marginLeft: 18,
  },
  card: {
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 18,
    minHeight: 142,
    paddingHorizontal: 18,
    paddingBottom: 30,
    paddingTop: 18,
    position: 'relative',
  },
  programTitle: {
    color: CAREON_COLORS.title,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  documentList: {
    gap: 12,
    marginTop: 12,
    paddingRight: 10,
  },
  checkLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  pressedCheckLine: {
    opacity: 0.7,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: CAREON_COLORS.primary,
    borderRadius: 2,
    borderWidth: 1.5,
    height: 14,
    justifyContent: 'center',
    marginTop: 1,
    width: 14,
  },
  checkedBox: {
    backgroundColor: CAREON_COLORS.primary,
  },
  checkText: {
    gap: 5,
  },
  checkTitle: {
    color: CAREON_COLORS.title,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  checkGuide: {
    color: CAREON_COLORS.text,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
  },
  checkedText: {
    color: CAREON_COLORS.muted,
    textDecorationLine: 'line-through',
  },
  checkedGuide: {
    color: CAREON_COLORS.faint,
    textDecorationLine: 'line-through',
  },
  linkWrap: {
    bottom: 14,
    paddingVertical: 4,
    position: 'absolute',
    right: 18,
  },
  linkText: {
    color: CAREON_COLORS.text,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
});
