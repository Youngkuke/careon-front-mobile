import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardTypeOptions, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/lib/api';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';

import { CareButton, Header, Screen } from './shared';

type ProfileTextEditScreenProps = {
  title: string;
  initialValue: string;
  keyboardType?: KeyboardTypeOptions;
  onSave: (value: string) => Promise<void>;
  secureTextEntry?: boolean;
};

export function ProfileTextEditScreen({
  title,
  initialValue,
  keyboardType,
  onSave,
  secureTextEntry,
}: ProfileTextEditScreenProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const returnToMyPage = () => replaceRoute('/mypage');
  const handleSave = async () => {
    setSaving(true);

    try {
      await onSave(value.trim());
      returnToMyPage();
    } catch (error) {
      Alert.alert('저장 실패', error instanceof ApiError ? error.message : '회원 정보를 수정하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <Header onBack={returnToMyPage} title={title} />

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
  inputRow: {
    alignItems: 'center',
    borderBottomColor: CAREON_COLORS.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: 25,
    marginTop: 86,
    paddingHorizontal: 18,
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
    maxWidth: 312,
    width: '82%',
  },
});
