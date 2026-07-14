import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { CareButton, ProfileRow, Screen } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { MOCK_USER } from '@/lib/mock-data';
import { pushRoute } from '@/lib/navigation';

export default function MyPageScreen() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.title}>마이페이지</Text>

      <View style={styles.rows}>
        <ProfileRow label="이름/닉네임" onPress={() => pushRoute('/profile-name')} value={MOCK_USER.name} />
        <ProfileRow label="이메일" onPress={() => pushRoute('/profile-email')} value={MOCK_USER.email} />
        <ProfileRow
          accessory={<Ionicons color={CAREON_COLORS.muted} name="chevron-forward" size={24} />}
          label="비밀번호 변경"
          onPress={() => pushRoute('/profile-password')}
        />
        <ProfileRow label="거주지" onPress={() => pushRoute('/profile-district')} value={MOCK_USER.district} />
        <ProfileRow
          accessory={
            <Switch
              ios_backgroundColor={CAREON_COLORS.line}
              onValueChange={setNotificationEnabled}
              thumbColor={CAREON_COLORS.background}
              trackColor={{ false: CAREON_COLORS.line, true: CAREON_COLORS.primary }}
              value={notificationEnabled}
            />
          }
          label="알림 수신 설정"
        />
      </View>

      <View style={styles.actions}>
        <CareButton onPress={() => Alert.alert('로그아웃', '더미 화면에서는 실제 로그아웃을 수행하지 않아요.')} variant="white">
          로그아웃
        </CareButton>
        <CareButton onPress={() => Alert.alert('회원 탈퇴', '더미 화면에서는 실제 탈퇴를 수행하지 않아요.')} variant="dangerText">
          회원 탈퇴
        </CareButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 31,
  },
  title: {
    color: CAREON_COLORS.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginLeft: 26,
  },
  rows: {
    marginTop: 74,
  },
  actions: {
    gap: 35,
    marginTop: 90,
    paddingHorizontal: 51,
  },
});
