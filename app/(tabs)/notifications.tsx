import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { NOTIFICATIONS, NotificationItem } from '@/lib/mock-data';
import { goBackOrReplace } from '@/lib/navigation';
import { useNotifications } from '@/lib/notification-state';

const iconSources = {
  date: require('@/assets/images/date.webp'),
  time: require('@/assets/images/time.webp'),
  alarm: require('@/assets/images/alarm.webp'),
  check: require('@/assets/images/check.webp'),
};

const fallbackIcons = {
  date: 'calendar-outline',
  time: 'time-outline',
  alarm: 'notifications',
  check: 'checkmark',
} as const;

function getIconKey(item: NotificationItem): keyof typeof iconSources {
  if (item.kind === 'result') {
    return 'check';
  }

  if ((item.daysLeft ?? 0) >= 7) {
    return 'date';
  }

  if ((item.daysLeft ?? 0) >= 3) {
    return 'time';
  }

  return 'alarm';
}

function NotificationIcon({ iconKey }: { iconKey: keyof typeof iconSources }) {
  const [imageVisible, setImageVisible] = useState(true);

  return (
    <View style={styles.iconWrap}>
      <View style={styles.fallbackIcon}>
        <Ionicons
          color={CAREON_COLORS.primary}
          name={fallbackIcons[iconKey]}
          size={22}
        />
      </View>
      {imageVisible ? (
        <Image
          contentFit="contain"
          onError={() => setImageVisible(false)}
          source={iconSources[iconKey]}
          style={styles.iconImage}
        />
      ) : null}
    </View>
  );
}

function NotificationCard({
  delay = 0,
  item,
  onDismiss,
}: {
  delay?: number;
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const iconKey = getIconKey(item);
  const entrance = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeOpacity = translateX.interpolate({
    extrapolate: 'clamp',
    inputRange: [-120, 0, 120],
    outputRange: [0.35, 1, 0.35],
  });
  const opacity = Animated.multiply(swipeOpacity, entrance);
  const entranceTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(entrance, {
        damping: 18,
        stiffness: 150,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, entrance]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 82 || Math.abs(gestureState.vx) > 0.75) {
        Animated.timing(translateX, {
          duration: 180,
          toValue: gestureState.dx >= 0 ? 420 : -420,
          useNativeDriver: true,
        }).start(() => onDismiss(item.id));
        return;
      }

      Animated.spring(translateX, {
        damping: 18,
        stiffness: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  }), [item.id, onDismiss, translateX]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.item,
        {
          opacity,
          transform: [{ translateY: entranceTranslateY }, { translateX }],
        },
      ]}>
      <NotificationIcon iconKey={iconKey} />
      <View style={styles.messageBlock}>
        <Text style={styles.message}>{item.message}</Text>
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { dismissAllNotifications, dismissNotification, visibleNotificationIds } = useNotifications();
  const visibleNotifications = NOTIFICATIONS.filter((item) => visibleNotificationIds.has(item.id));

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page}>
      <Header
        onBack={() => goBackOrReplace('/calendar')}
        right={visibleNotifications.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={dismissAllNotifications}
            style={({ pressed }) => [styles.readAllButton, pressed && styles.pressedReadAllButton]}>
            <Text style={styles.readAllText}>전체 읽음</Text>
          </Pressable>
        ) : null}
        title="알림"
      />

      <View style={styles.list}>
        {visibleNotifications.length ? visibleNotifications.map((item, index) => (
          <NotificationCard delay={80 + (index * 60)} item={item} key={item.id} onDismiss={dismissNotification} />
        )) : (
          <View style={styles.emptyCard}>
            <Ionicons color={CAREON_COLORS.primary} name="checkmark-circle" size={30} />
            <Text style={styles.emptyTitle}>새 알림이 없어요</Text>
            <Text style={styles.emptyText}>확인한 알림은 이 화면에서 사라져요.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  readAllButton: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderColor: CAREON_COLORS.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 13,
    ...CAREON_SHADOW,
  },
  pressedReadAllButton: {
    opacity: 0.72,
  },
  readAllText: {
    color: CAREON_COLORS.title,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  list: {
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 26,
  },
  item: {
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    minHeight: 102,
    paddingBottom: 30,
    paddingHorizontal: 16,
    paddingTop: 16,
    ...CAREON_SHADOW,
  },
  iconWrap: {
    height: 34,
    marginTop: 1,
    width: 34,
  },
  fallbackIcon: {
    alignItems: 'center',
    backgroundColor: '#E9FBF6',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    width: 34,
  },
  iconImage: {
    height: 34,
    position: 'absolute',
    width: 34,
  },
  messageBlock: {
    flex: 1,
    paddingRight: 4,
  },
  message: {
    color: CAREON_COLORS.title,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  timestamp: {
    color: CAREON_COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    position: 'absolute',
    right: 17,
    bottom: 13,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 30,
    ...CAREON_SHADOW,
  },
  emptyTitle: {
    color: CAREON_COLORS.title,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 10,
  },
  emptyText: {
    color: CAREON_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 5,
  },
});
