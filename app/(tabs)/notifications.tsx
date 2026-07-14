import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { NOTIFICATIONS, NotificationItem } from '@/lib/mock-data';
import { goBackOrReplace } from '@/lib/navigation';

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

export default function NotificationsScreen() {
  return (
    <Screen scroll>
      <Header onBack={() => goBackOrReplace('/calendar')} title="알림" />

      <View style={styles.list}>
        {NOTIFICATIONS.map((item) => {
          const iconKey = getIconKey(item);

          return (
            <View key={item.id} style={styles.item}>
              <NotificationIcon iconKey={iconKey} />
              <Text numberOfLines={2} style={styles.message}>{item.message}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  item: {
    borderBottomColor: CAREON_COLORS.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 74,
    position: 'relative',
  },
  iconWrap: {
    height: 27,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 27,
  },
  fallbackIcon: {
    alignItems: 'center',
    height: 27,
    justifyContent: 'center',
    position: 'absolute',
    width: 27,
  },
  iconImage: {
    height: 27,
    position: 'absolute',
    width: 27,
  },
  message: {
    color: CAREON_COLORS.title,
    fontSize: 15,
    fontWeight: '700',
    left: 30,
    lineHeight: 21,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  timestamp: {
    bottom: 13,
    color: CAREON_COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
    position: 'absolute',
    right: 20,
  },
});
