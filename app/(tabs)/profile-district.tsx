import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-state';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { SEOUL_DISTRICTS } from '@/lib/mock-data';
import { replaceRoute } from '@/lib/navigation';
import { useSaveFeedback } from '@/lib/save-feedback-state';

export default function ProfileDistrictScreen() {
  const { updateMe, user } = useAuth();
  const [district, setDistrict] = useState(user?.region ?? '');
  const [saving, setSaving] = useState(false);
  const { showSaved } = useSaveFeedback();
  const returnToMyPage = () => replaceRoute('/mypage');
  const handleSave = async () => {
    setSaving(true);

    try {
      await updateMe({ region: district });
      showSaved();
      returnToMyPage();
    } catch (error) {
      Alert.alert('저장 실패', error instanceof ApiError ? error.message : '거주지를 변경하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <Header onBack={returnToMyPage} title="거주지" />

      <View style={styles.grid}>
        {SEOUL_DISTRICTS.map((item) => {
          const selected = item === district;

          return (
            <Pressable
              key={item}
              onPress={() => setDistrict(item)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.selectedChip,
                pressed && styles.pressedChip,
              ]}>
              <Text style={[styles.chipText, selected && styles.selectedChipText]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <CareButton disabled={saving} onPress={handleSave} style={styles.saveButton}>
        {saving ? '저장 중' : '저장'}
      </CareButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 31,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 70,
    paddingHorizontal: 36,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: 15,
  },
  selectedChip: {
    backgroundColor: CAREON_COLORS.primary,
  },
  pressedChip: {
    opacity: 0.75,
  },
  chipText: {
    color: CAREON_COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedChipText: {
    color: CAREON_COLORS.background,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: 42,
    maxWidth: 312,
    width: '82%',
  },
});
