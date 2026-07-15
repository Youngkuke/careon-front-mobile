import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { NOTIFICATIONS } from './mock-data';

type NotificationContextValue = {
  dismissAllNotifications: () => void;
  dismissNotification: (id: string) => void;
  hasUnreadNotifications: boolean;
  visibleNotificationIds: Set<string>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: PropsWithChildren) {
  const initialVisibleState = useMemo(() => {
    return Object.fromEntries(NOTIFICATIONS.map((notification) => [notification.id, false]));
  }, []);
  const [dismissedNotifications, setDismissedNotifications] = useState<Record<string, boolean>>(initialVisibleState);

  const value = useMemo<NotificationContextValue>(() => ({
    dismissAllNotifications: () => {
      setDismissedNotifications(Object.fromEntries(NOTIFICATIONS.map((notification) => [notification.id, true])));
    },
    dismissNotification: (id: string) => {
      setDismissedNotifications((current) => ({ ...current, [id]: true }));
    },
    hasUnreadNotifications: NOTIFICATIONS.some((notification) => !dismissedNotifications[notification.id]),
    visibleNotificationIds: new Set(
      NOTIFICATIONS
        .filter((notification) => !dismissedNotifications[notification.id])
        .map((notification) => notification.id),
    ),
  }), [dismissedNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
}
