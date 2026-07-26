import Ionicons from '@expo/vector-icons/Ionicons';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AppDataProvider } from '@/lib/app-data-state';
import { AuthProvider } from '@/lib/auth-state';
import { PushNotificationProvider } from '@/lib/push-notification-state';
import { WearProvider } from '@/lib/wear-state';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [iconsLoaded, iconFontError] = useFonts(Ionicons.font);

  if (iconFontError) {
    throw iconFontError;
  }

  if (!iconsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          <PushNotificationProvider>
            <AppDataProvider>
              <WearProvider>
                <Stack screenOptions={{ contentStyle: { backgroundColor: '#FFFFFF' }, headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="loading" />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
              </WearProvider>
              <StatusBar style="dark" />
            </AppDataProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
