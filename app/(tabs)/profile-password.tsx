import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CareButton, FormField, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { goBackOrReplace } from '@/lib/navigation';

export default function ProfilePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <Screen contentStyle={styles.content}>
      <Header onBack={() => goBackOrReplace('/mypage')} title="비밀번호 변경" />

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
  form: {
    gap: 22,
    marginTop: 72,
    paddingHorizontal: 45,
  },
  input: {
    backgroundColor: CAREON_COLORS.input,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: 42,
    width: 312,
  },
});
