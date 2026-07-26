import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from './auth-state';
import { clearStoredPushToken, getStoredPushToken, saveStoredPushToken } from './token-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerPushToken(
  authenticatedRequest: ReturnType<typeof useAuth>['authenticatedRequest'],
) {
  // The current demo supports remote push on Android only. Keeping iOS out of this flow lets
  // every non-push feature run in a free local simulator build without APNs credentials.
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('emergency', {
    enableVibrate: true,
    importance: Notifications.AndroidImportance.MAX,
    name: '긴급 도움 요청',
    sound: 'default',
    vibrationPattern: [0, 300, 150, 300],
  });
  await Notifications.setNotificationChannelAsync('policy', {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: '제도 알림',
  });

  const permission = await Notifications.getPermissionsAsync();
  const finalPermission = permission.status === 'granted'
    ? permission
    : await Notifications.requestPermissionsAsync();
  if (finalPermission.status !== 'granted') return;

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    ?? Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  if (!projectId || typeof projectId !== 'string') {
    console.warn('Expo Push Token을 발급하려면 EXPO_PUBLIC_EAS_PROJECT_ID 설정이 필요합니다.');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await authenticatedRequest('/api/app/users/me/push-tokens', {
    body: { platform: 'expo', token },
    method: 'PUT',
  });
  await saveStoredPushToken(token);
}

async function unregisterPushToken(
  authenticatedRequest: ReturnType<typeof useAuth>['authenticatedRequest'],
) {
  const token = await getStoredPushToken();
  if (!token) return;

  try {
    await authenticatedRequest('/api/app/users/me/push-tokens', {
      body: { token },
      method: 'DELETE',
    });
  } finally {
    // Do not keep a token locally once the user has turned delivery off. A later opt-in will
    // obtain and register a fresh Expo token.
    await clearStoredPushToken();
  }
}

function openNotificationTarget(notification: Notifications.Notification) {
  const url = notification.request.content.data?.url;
  if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
}

export function PushNotificationProvider({ children }: PropsWithChildren) {
  const { authenticatedRequest, status, user } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated' || Platform.OS !== 'android') return;

    if (!user?.notificationEnabled) {
      void unregisterPushToken(authenticatedRequest).catch((error) => {
        console.warn('푸시 토큰 해제에 실패했어요.', error);
      });
      return;
    }

    void registerPushToken(authenticatedRequest).catch((error) => {
      console.warn('푸시 토큰 등록에 실패했어요.', error);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openNotificationTarget(response.notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationTarget(response.notification);
    });
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      // The native device token changed. Fetch the matching Expo token again before updating
      // the backend, because it only accepts ExpoPushToken/ExponentPushToken values.
      void registerPushToken(authenticatedRequest).catch((error) => {
        console.warn('변경된 푸시 토큰 등록에 실패했어요.', error);
      });
    });

    return () => {
      responseSubscription.remove();
      tokenSubscription.remove();
    };
  }, [authenticatedRequest, status, user?.notificationEnabled]);

  return children;
}
