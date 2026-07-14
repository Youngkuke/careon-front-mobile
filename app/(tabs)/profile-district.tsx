import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { MOCK_USER, SEOUL_DISTRICTS } from '@/lib/mock-data';
import { goBackOrReplace } from '@/lib/navigation';

export default function ProfileDistrictScreen() {
  const [district, setDistrict] = useState(MOCK_USER.district);

  return (
    <Screen scroll contentStyle={styles.content}>
      <Header onBack={() => goBackOrReplace('/mypage')} title="거주지" />

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
              {selected ? <Ionicons color={CAREON_COLORS.background} name="checkmark" size={17} /> : null}
            </Pressable>
          );
        })}
      </View>

      <CareButton onPress={() => goBackOrReplace('/mypage')} style={styles.saveButton}>
        저장
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
    width: 312,
  },
});
