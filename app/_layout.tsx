import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ChecklistProvider } from '@/lib/checklist-state';
import { NotificationProvider } from '@/lib/notification-state';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ChecklistProvider>
          <NotificationProvider>
            <Stack screenOptions={{ contentStyle: { backgroundColor: '#FFFFFF' }, headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="loading" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="dark" />
          </NotificationProvider>
        </ChecklistProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
