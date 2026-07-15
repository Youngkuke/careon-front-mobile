import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';

import { CAREON_COLORS } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';

export default function SplashScreen() {
  const splashProgress = useRef(new Animated.Value(0)).current;
  const { height, width } = useWindowDimensions();
  const logoWidth = Math.min(162, Math.max(130, width * 0.38));
  const backgroundColor = splashProgress.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [CAREON_COLORS.primary, '#EFFFF9', CAREON_COLORS.background],
  });
  const whiteLogoOpacity = splashProgress.interpolate({
    inputRange: [0, 0.36, 0.68],
    outputRange: [1, 0.85, 0],
  });
  const mintLogoOpacity = splashProgress.interpolate({
    inputRange: [0.24, 0.58, 1],
    outputRange: [0, 1, 1],
  });
  const logoScale = splashProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.96, 1.04, 1],
  });
  const logoTranslateY = splashProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  useEffect(() => {
    Animated.timing(splashProgress, {
      duration: 1700,
      toValue: 1,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      replaceRoute('/onboarding');
    }, 2150);

    return () => clearTimeout(timer);
  }, [splashProgress]);

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        style={[
          styles.logoStack,
          {
            top: height * 0.43,
            transform: [{ translateY: logoTranslateY }, { scale: logoScale }],
            width: logoWidth,
          },
        ]}>
        <Animated.View style={[styles.logoLayer, { opacity: whiteLogoOpacity }]}>
          <Image
            accessibilityLabel="CareON"
            contentFit="contain"
            source={require('@/assets/images/logo.webp')}
            style={[styles.logo, styles.whiteLogo]}
          />
        </Animated.View>
        <Animated.View style={[styles.logoLayer, { opacity: mintLogoOpacity }]}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel="CareON"
            contentFit="contain"
            source={require('@/assets/images/logo.webp')}
            style={styles.logo}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  logoStack: {
    aspectRatio: 160 / 60,
    position: 'absolute',
  },
  logoLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  whiteLogo: {
    tintColor: CAREON_COLORS.background,
  },
});
