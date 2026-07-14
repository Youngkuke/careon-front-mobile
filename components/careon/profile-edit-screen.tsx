import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardTypeOptions, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CAREON_COLORS } from '@/lib/careon-theme';
import { goBackOrReplace } from '@/lib/navigation';

import { CareButton, Header, Screen } from './shared';

type ProfileTextEditScreenProps = {
  title: string;
  initialValue: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
};

export function ProfileTextEditScreen({
  title,
  initialValue,
  keyboardType,
  secureTextEntry,
}: ProfileTextEditScreenProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <Screen contentStyle={styles.content}>
      <Header onBack={() => goBackOrReplace('/mypage')} title={title} />

      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize="none"
          keyboardType={keyboardType}
          onChangeText={setValue}
          placeholder={title}
          placeholderTextColor={CAREON_COLORS.faint}
          secureTextEntry={secureTextEntry}
          selectionColor={CAREON_COLORS.primary}
          style={styles.input}
          value={value}
        />
        {value.length ? (
          <Pressable accessibilityLabel="입력 지우기" hitSlop={12} onPress={() => setValue('')} style={styles.clearButton}>
            <Ionicons color={CAREON_COLORS.text} name="close-circle" size={22} />
          </Pressable>
        ) : null}
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
  inputRow: {
    alignItems: 'center',
    borderBottomColor: CAREON_COLORS.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: 25,
    marginTop: 86,
    paddingHorizontal: 26,
  },
  input: {
    color: CAREON_COLORS.title,
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    height: 52,
  },
  clearButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: 47,
    width: 312,
  },
});
