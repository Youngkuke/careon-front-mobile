import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AppDataProvider } from '@/lib/app-data-state';
import { AuthProvider } from '@/lib/auth-state';
import { WearProvider } from '@/lib/wear-state';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          <AppDataProvider>
            <WearProvider><Stack screenOptions={{ contentStyle: { backgroundColor: '#FFFFFF' }, headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="loading" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="wear" />
              <Stack.Screen name="emergency" />
            </Stack></WearProvider>
            <StatusBar style="dark" />
          </AppDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
