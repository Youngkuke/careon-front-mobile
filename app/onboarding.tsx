import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { CareButton, FormField, Screen } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { pushRoute } from '@/lib/navigation';

const FIELD_GAP = 24;
const LOGIN_BUTTON_GAP = FIELD_GAP * 2;
const SIGNUP_COPY_GAP = LOGIN_BUTTON_GAP * 1.5;

export default function OnboardingScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen scroll contentStyle={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboard}>
        <View style={styles.hero}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>CareON에 오신 걸 환영해요</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.description}>웹에서 저장한 제도와 일정을 앱에서 바로 확인할 수 있어요</Text>
        </View>

        <View style={styles.form}>
          <FormField
            autoCapitalize="none"
            inputMode="email"
            label="이메일"
            onChangeText={setEmail}
            placeholder="minji@gmail.com"
            value={email}
          />
          <FormField
            label="비밀번호"
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry
            value={password}
          />
        </View>

        <View style={styles.actions}>
          <CareButton onPress={() => pushRoute('/loading')}>로그인</CareButton>
          <View style={styles.signupCopy}>
            <Text style={styles.mutedText}>아직 계정이 없으신가요?</Text>
            <Text style={styles.mutedText}>웹사이트에서 회원가입 후 이용할 수 있어요</Text>
          </View>
          <CareButton
            onPress={() => Linking.openURL('https://care-on-gamma.vercel.app/')}
            style={styles.signupButton}
            textStyle={styles.signupButtonText}
            variant="white">
            회원가입 하러 가기
          </CareButton>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    maxWidth: 360,
    paddingHorizontal: 24,
    width: '100%',
  },
  screen: {
    alignItems: 'center',
  },
  hero: {
    marginTop: 72,
  },
  title: {
    color: CAREON_COLORS.title,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  description: {
    color: CAREON_COLORS.text,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 10,
  },
  form: {
    gap: FIELD_GAP,
    marginTop: 56,
  },
  actions: {
    marginTop: LOGIN_BUTTON_GAP,
    paddingBottom: 64,
  },
  signupCopy: {
    alignItems: 'center',
    gap: 7,
    marginTop: SIGNUP_COPY_GAP,
  },
  mutedText: {
    color: CAREON_COLORS.faint,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
  signupButton: {
    alignSelf: 'center',
    height: 30,
    marginTop: 26,
    paddingHorizontal: 12,
    width: 142,
  },
  signupButtonText: {
    fontSize: 12,
  },
});
