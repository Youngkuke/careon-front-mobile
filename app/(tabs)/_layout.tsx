import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { CAREON_COLORS } from '@/lib/careon-theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 15) : 15;
  const tabBarHeight = 60 + tabBarBottomPadding;
  const tabBarStyle = {
    backgroundColor: CAREON_COLORS.page,
    borderTopWidth: 0,
    elevation: 0,
    height: tabBarHeight,
    paddingBottom: tabBarBottomPadding,
    paddingTop: 8,
    shadowOpacity: 0,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CAREON_COLORS.text,
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: CAREON_COLORS.text,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          lineHeight: 12,
          marginTop: 3,
        },
        tabBarStyle,
      }}>
      <Tabs.Screen
        name="calendar"
        options={{
          title: '캘린더',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color} name={focused ? 'calendar' : 'calendar-outline'} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: '투두',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color} name={focused ? 'list' : 'list-outline'} size={29} />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color} name={focused ? 'person' : 'person-outline'} size={29} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: '알림',
        }}
      />
      <Tabs.Screen
        name="profile-name"
        options={{
          href: null,
          title: '이름/닉네임',
        }}
      />
      <Tabs.Screen
        name="profile-email"
        options={{
          href: null,
          title: '이메일',
        }}
      />
      <Tabs.Screen
        name="profile-password"
        options={{
          href: null,
          title: '비밀번호 변경',
        }}
      />
      <Tabs.Screen
        name="profile-district"
        options={{
          href: null,
          title: '거주지',
        }}
      />
    </Tabs>
  );
}
