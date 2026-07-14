import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { CAREON_COLORS } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      replaceRoute('/onboarding');
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="CareON"
        contentFit="contain"
        source={require('@/assets/images/logo.webp')}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    height: 60,
    width: 160,
  },
});
