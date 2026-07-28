import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { CareButton, FormField, Header, Screen } from '@/components/careon/shared';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-state';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { useSaveFeedback } from '@/lib/save-feedback-state';

export default function ProfilePasswordScreen() {
  const { updateMe } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { showSaved } = useSaveFeedback();
  const returnToMyPage = () => replaceRoute('/mypage');
  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('확인 필요', '새 비밀번호가 서로 일치하지 않아요.');
      return;
    }

    setSaving(true);

    try {
      await updateMe({ password: newPassword });
      showSaved();
      returnToMyPage();
    } catch (error) {
      Alert.alert('저장 실패', error instanceof ApiError ? error.message : '비밀번호를 변경하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <Header onBack={returnToMyPage} title="비밀번호 변경" />

      <View style={styles.form}>
        <FormField
          label="현재 비밀번호"
          onChangeText={setCurrentPassword}
          placeholder="현재 비밀번호"
          secureTextEntry
          style={styles.input}
          value={currentPassword}
        />
        <FormField
          label="새 비밀번호"
          onChangeText={setNewPassword}
          placeholder="새 비밀번호"
          secureTextEntry
          style={styles.input}
          value={newPassword}
        />
        <FormField
          label="새 비밀번호 확인"
          onChangeText={setConfirmPassword}
          placeholder="새 비밀번호 확인"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
        />
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
  form: {
    gap: 22,
    marginTop: 72,
    paddingHorizontal: 32,
  },
  input: {
    backgroundColor: CAREON_COLORS.input,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: 42,
    maxWidth: 312,
    width: '82%',
  },
});
