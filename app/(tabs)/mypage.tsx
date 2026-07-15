import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { CareButton, CareEntrance, Screen, sharedStyles } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { MOCK_USER } from '@/lib/mock-data';
import { pushRoute } from '@/lib/navigation';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  accessory?: React.ReactNode;
};

function SettingRow({ icon, label, value, onPress, accessory }: SettingRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressedRow]}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons color={CAREON_COLORS.primaryDark} name={icon} size={18} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value ? <Text numberOfLines={1} style={styles.settingValue}>{value}</Text> : null}
        {accessory ?? (onPress ? <Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={20} /> : null)}
      </View>
    </Pressable>
  );
}

export default function MyPageScreen() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
      <Text style={styles.title}>마이페이지</Text>

      <CareEntrance delay={80}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{MOCK_USER.name.slice(0, 1)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{MOCK_USER.name}</Text>
            <Text numberOfLines={1} style={styles.profileEmail}>{MOCK_USER.email}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => pushRoute('/profile-name')}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressedRow]}>
            <Ionicons color={CAREON_COLORS.primaryDark} name="create-outline" size={17} />
          </Pressable>
        </View>
      </CareEntrance>

      <CareEntrance delay={150}>
        <View style={styles.sectionCard}>
          <SettingRow
            icon="mail-outline"
            label="이메일"
            onPress={() => pushRoute('/profile-email')}
            value={MOCK_USER.email}
          />
          <SettingRow
            icon="lock-closed-outline"
            label="비밀번호 변경"
            onPress={() => pushRoute('/profile-password')}
          />
          <SettingRow
            icon="location-outline"
            label="거주지"
            onPress={() => pushRoute('/profile-district')}
            value={MOCK_USER.district}
          />
        </View>
      </CareEntrance>

      <CareEntrance delay={220}>
        <View style={styles.sectionCard}>
          <SettingRow
            accessory={
              <Switch
                ios_backgroundColor={CAREON_COLORS.line}
                onValueChange={setNotificationEnabled}
                thumbColor={CAREON_COLORS.background}
                trackColor={{ false: CAREON_COLORS.line, true: CAREON_COLORS.primary }}
                value={notificationEnabled}
              />
            }
            icon="notifications-outline"
            label="알림 수신 설정"
          />
        </View>
      </CareEntrance>

      <CareEntrance delay={290}>
        <View style={styles.actions}>
          <CareButton onPress={() => Alert.alert('로그아웃', '더미 화면에서는 실제 로그아웃을 수행하지 않아요.')} variant="white">
            로그아웃
          </CareButton>
          <CareButton onPress={() => Alert.alert('회원 탈퇴', '더미 화면에서는 실제 탈퇴를 수행하지 않아요.')} variant="dangerText">
            회원 탈퇴
          </CareButton>
        </View>
      </CareEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    color: CAREON_COLORS.title,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 24,
    flexDirection: 'row',
    marginTop: 24,
    padding: 18,
    ...sharedStyles.cardShadow,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#DDF8EF',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: CAREON_COLORS.primaryDark,
    fontSize: 24,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: CAREON_COLORS.title,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  profileEmail: {
    color: CAREON_COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 5,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sectionCard: {
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 22,
    marginTop: 18,
    overflow: 'hidden',
    ...CAREON_SHADOW,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 16,
  },
  pressedRow: {
    opacity: 0.72,
  },
  settingLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF8F5',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  settingLabel: {
    color: CAREON_COLORS.title,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  settingRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    maxWidth: '52%',
  },
  settingValue: {
    color: CAREON_COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
  },
  actions: {
    gap: 14,
    marginTop: 24,
    paddingHorizontal: 26,
    paddingBottom: 18,
  },
});
