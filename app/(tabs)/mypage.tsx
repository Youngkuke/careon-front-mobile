import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { CareButton, CareEntrance, Screen, sharedStyles } from '@/components/careon/shared';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-state';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { pushRoute, replaceRoute } from '@/lib/navigation';
import { useSaveFeedback } from '@/lib/save-feedback-state';

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
  const { deleteAccount, logout, refreshMe, updateMe, user } = useAuth();
  const [notificationEnabled, setNotificationEnabled] = useState(user?.notificationEnabled ?? false);
  const [deviceNotificationDenied, setDeviceNotificationDenied] = useState(false);
  const { showSaved } = useSaveFeedback();
  const displayName = user?.name ?? '';
  const displayEmail = user?.email ?? '';
  const displayRegion = user?.region ?? '';

  useEffect(() => {
    setNotificationEnabled(user?.notificationEnabled ?? false);
  }, [user?.notificationEnabled]);

  useFocusEffect(useCallback(() => {
    void refreshMe().catch(() => undefined);
  }, [refreshMe]));

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    void Notifications.getPermissionsAsync().then((permission) => {
      if (active) setDeviceNotificationDenied(permission.status !== 'granted');
    });
    return () => { active = false; };
  }, []);

  const handleNotificationChange = async (nextValue: boolean) => {
    setNotificationEnabled(nextValue);

    try {
      await updateMe({ notificationEnabled: nextValue });
      showSaved();
    } catch (error) {
      setNotificationEnabled(!nextValue);
      Alert.alert('저장 실패', error instanceof ApiError ? error.message : '알림 설정을 저장하지 못했어요.');
    }
  };

  const openNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('알림 설정', '기기 설정에서 CareOn의 알림을 허용해주세요.');
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { style: 'cancel', text: '취소' },
      {
        onPress: async () => {
          await logout();
          replaceRoute('/onboarding');
        },
        text: '로그아웃',
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('회원 탈퇴', '계정을 삭제할까요? 저장한 제도와 알림도 함께 정리됩니다.', [
      { style: 'cancel', text: '취소' },
      {
        onPress: async () => {
          try {
            await deleteAccount();
            replaceRoute('/onboarding');
          } catch (error) {
            Alert.alert('탈퇴 실패', error instanceof ApiError ? error.message : '회원 탈퇴를 완료하지 못했어요.');
          }
        },
        style: 'destructive',
        text: '탈퇴',
      },
    ]);
  };

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
      <Text style={styles.title}>마이페이지</Text>

      <CareEntrance delay={80}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text numberOfLines={1} style={styles.profileEmail}>{displayEmail}</Text>
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
            value={displayEmail}
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
            value={displayRegion}
          />
        </View>
      </CareEntrance>

      <CareEntrance delay={220}>
        <View style={styles.sectionCard}>
          <SettingRow icon="watch-outline" label="워치·안심 구역" value="연결 관리" onPress={() => pushRoute('/wear')} />
        </View>
      </CareEntrance>

      <CareEntrance delay={250}>
        <View style={styles.sectionCard}>
          <SettingRow
            accessory={
              <Switch
                ios_backgroundColor={CAREON_COLORS.line}
                onValueChange={handleNotificationChange}
                thumbColor={CAREON_COLORS.background}
                trackColor={{ false: CAREON_COLORS.line, true: CAREON_COLORS.primary }}
                value={notificationEnabled}
              />
            }
            icon="notifications-outline"
            label="정책·일반 알림 수신"
          />
          {deviceNotificationDenied ? <Pressable accessibilityRole="button" onPress={() => void openNotificationSettings()} style={styles.permissionNotice}><Ionicons color={CAREON_COLORS.danger} name="warning-outline" size={17} /><Text style={styles.permissionText}>기기 알림이 꺼져 있어요. 설정에서 허용하기</Text><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={18} /></Pressable> : null}
        </View>
      </CareEntrance>

      <CareEntrance delay={320}>
        <View style={styles.actions}>
          <CareButton onPress={handleLogout} variant="white">
            로그아웃
          </CareButton>
          <CareButton onPress={handleDeleteAccount} variant="dangerText">
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
    paddingTop: '4%',
  },
  title: {
    color: CAREON_COLORS.title,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
  },
  emergencyNotice: {
    color: CAREON_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  permissionNotice: {
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  permissionText: {
    color: CAREON_COLORS.text,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: '#EBEBEB',
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
