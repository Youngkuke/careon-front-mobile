import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';

export default function LoadingScreen() {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      replaceRoute('/calendar');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((current) => (current + 1) % 3);
    }, 320);

    return () => clearInterval(interval);
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.greeting}>반가워요!</Text>
        <View style={styles.imageWrap}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require('@/assets/images/loading-glow.webp')}
            style={styles.glowImage}
          />
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require('@/assets/images/loading.webp')}
            style={styles.image}
          />
        </View>
        <View accessibilityLabel="로딩 중" style={styles.dots}>
          {[0, 1, 2].map((dot) => (
            <View key={dot} style={[styles.dot, dot === activeDot ? styles.activeDot : styles.inactiveDot]} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 82,
  },
  greeting: {
    color: CAREON_COLORS.title,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 28,
  },
  imageWrap: {
    alignItems: 'center',
    height: 231,
    justifyContent: 'center',
    width: 231,
  },
  glowImage: {
    height: 231,
    position: 'absolute',
    width: 231,
  },
  image: {
    height: 185,
    width: 185,
  },
  dots: {
    flexDirection: 'row',
    gap: 13,
    marginTop: 42,
  },
  dot: {
    borderRadius: 9,
    height: 18,
    width: 18,
  },
  activeDot: {
    backgroundColor: CAREON_COLORS.primary,
  },
  inactiveDot: {
    backgroundColor: '#EDEDED',
  },
});
