import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import type { NotificationResponse, SavedPolicyResponse, TodoPolicyResponse } from './api';
import { useAuth } from './auth-state';
import { CAREON_COLORS } from './careon-theme';

export type SavedProgram = {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  dday: string;
  accentColor: string;
  documents: Array<{
    title: string;
    guide: string;
  }>;
  schedule: {
    date: string;
    detail: string;
  };
  url: string;
};

export type CalendarEvent = {
  id: string;
  programId: string;
  year: number;
  monthIndex: number;
  day: number;
  type: 'deadline' | 'result';
  color: string;
  label: string;
};

export type NotificationItem = {
  id: string;
  policyId: number | null;
  servId: string | null;
  message: string;
  timestamp: string;
  daysLeft?: number;
  kind: 'deadline' | 'result';
};

export type TodoProgram = {
  id: string;
  savedPolicyId: number;
  title: string;
  deadline: string;
  isExpired: boolean;
  isApplied: boolean;
  sourceUrl: string;
  documents: Array<{
    todoId: number;
    title: string;
    guide: string;
    isChecked: boolean;
  }>;
};

type AppDataContextValue = {
  answerExpiredPolicy: (savedPolicyId: number, applied: boolean) => Promise<void>;
  calendarEvents: CalendarEvent[];
  dismissAllNotifications: () => void;
  dismissNotification: (id: string) => void;
  hasUnreadNotifications: boolean;
  loadNotifications: () => Promise<void>;
  loading: boolean;
  notifications: NotificationItem[];
  refreshData: () => Promise<void>;
  savedPrograms: SavedProgram[];
  todoPrograms: TodoProgram[];
  toggleTodo: (todoId: number, isChecked: boolean) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function formatDateLabel(date: string) {
  const localDate = parseLocalDate(date);

  return `${localDate.getMonth() + 1}월 ${localDate.getDate()}일 (${weekDays[localDate.getDay()]})`;
}

function formatShortDate(date: string) {
  const localDate = parseLocalDate(date);

  return `${localDate.getMonth() + 1}월 ${localDate.getDate()}일`;
}

function makeProgramId(policy: SavedPolicyResponse, index: number) {
  return String(policy.saved_policy_id ?? `${policy.policy_name}-${policy.application_deadline ?? policy.result_date ?? index}`);
}

function mapSavedProgram(policy: SavedPolicyResponse, index: number): SavedProgram {
  const primaryDate = policy.application_deadline ?? policy.result_date;
  const documents = policy.documents.map((document) => ({
    guide: '제출처 안내를 확인해주세요',
    title: document,
  }));

  return {
    accentColor: policy.application_deadline ? CAREON_COLORS.danger : CAREON_COLORS.blue,
    agency: '',
    dday: policy.application_deadline_d_day ?? policy.result_date_d_day ?? '',
    deadline: primaryDate ? formatDateLabel(primaryDate) : '일정 없음',
    documents,
    id: makeProgramId(policy, index),
    schedule: {
      date: primaryDate ? formatShortDate(primaryDate) : '일정 없음',
      detail: documents.length ? `필요 서류 | ${documents.map((item) => item.title).join(', ')}` : '필요 서류 없음',
    },
    title: policy.policy_name,
    url: '',
  };
}

function mapCalendarEvents(policy: SavedPolicyResponse, index: number): CalendarEvent[] {
  const programId = makeProgramId(policy, index);
  const events: CalendarEvent[] = [];

  if (policy.application_deadline) {
    const date = parseLocalDate(policy.application_deadline);
    events.push({
      color: CAREON_COLORS.danger,
      day: date.getDate(),
      id: `${programId}-deadline`,
      label: '신청 마감',
      monthIndex: date.getMonth(),
      programId,
      type: 'deadline',
      year: date.getFullYear(),
    });
  }

  if (policy.result_date) {
    const date = parseLocalDate(policy.result_date);
    events.push({
      color: CAREON_COLORS.blue,
      day: date.getDate(),
      id: `${programId}-result`,
      label: '결과 발표',
      monthIndex: date.getMonth(),
      programId,
      type: 'result',
      year: date.getFullYear(),
    });
  }

  return events;
}

function mapNotification(item: NotificationResponse): NotificationItem {
  const isResult = item.notification_type === 'RESULT_DDAY';
  const daysLeft = item.notification_type === 'DEADLINE_D7'
    ? 7
    : item.notification_type === 'DEADLINE_D3'
      ? 3
      : item.notification_type === 'DEADLINE_D1'
        ? 1
        : undefined;
  const message = isResult
    ? `[${item.policy_name}]\n오늘 결과가 발표돼요. 확인해보세요!`
    : `[${item.policy_name}]\n마감 ${daysLeft}일 전이에요! 놓치지 않게 확인해주세요`;

  return {
    daysLeft,
    id: String(item.notification_id),
    kind: isResult ? 'result' : 'deadline',
    message,
    policyId: item.policy_id,
    servId: item.serv_id,
    timestamp: item.relative_time,
  };
}

function mapTodoProgram(item: TodoPolicyResponse): TodoProgram {
  return {
    deadline: item.application_deadline ? formatDateLabel(item.application_deadline) : '일정 없음',
    documents: item.documents.map((document) => ({
      guide: document.issuers.length
        ? document.issuers.map((issuer) => issuer.issue_guide ?? issuer.issuer_name).join(', ')
        : '발급처 확인 필요',
      isChecked: document.is_checked,
      title: document.document_name,
      todoId: document.todo_id,
    })),
    id: String(item.saved_policy_id),
    isApplied: item.is_applied ?? false,
    isExpired: item.is_expired,
    savedPolicyId: item.saved_policy_id,
    sourceUrl: item.link ?? '',
    title: item.policy_name,
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { authenticatedRequest, status } = useAuth();
  const [savedPolicies, setSavedPolicies] = useState<SavedPolicyResponse[]>([]);
  const [todoPrograms, setTodoPrograms] = useState<TodoProgram[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Record<string, boolean>>({});
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (status !== 'authenticated') {
      setSavedPolicies([]);
      setTodoPrograms([]);
      setNotifications([]);
      setHasUnreadNotifications(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [nextSavedPolicies, nextTodos, nextUnreadCount] = await Promise.all([
        authenticatedRequest<SavedPolicyResponse[]>('/api/app/users/me/saved-policies'),
        authenticatedRequest<TodoPolicyResponse[]>('/api/app/users/me/todos'),
        authenticatedRequest<{ unread_count: number }>('/api/app/users/me/notifications/unread-count'),
      ]);

      setSavedPolicies(nextSavedPolicies);
      setTodoPrograms(nextTodos.map(mapTodoProgram));
      setHasUnreadNotifications(nextUnreadCount.unread_count > 0);
    } finally {
      setLoading(false);
    }
  }, [authenticatedRequest, status]);

  const loadNotifications = useCallback(async () => {
    if (status !== 'authenticated') {
      setNotifications([]);
      setDismissedNotifications({});
      setHasUnreadNotifications(false);
      return;
    }

    const nextNotifications = await authenticatedRequest<NotificationResponse[]>('/api/app/users/me/notifications');
    await authenticatedRequest<{ updated_count: number; message: string }>('/api/app/users/me/notifications/read-all', {
      method: 'PATCH',
    });

    setNotifications(nextNotifications.map(mapNotification));
    setDismissedNotifications({});
    setHasUnreadNotifications(false);
  }, [authenticatedRequest, status]);

  const dismissNotification = useCallback((id: string) => {
    setDismissedNotifications((current) => ({ ...current, [id]: true }));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setDismissedNotifications(Object.fromEntries(notifications.map((notification) => [notification.id, true])));
  }, [notifications]);

  const answerExpiredPolicy = useCallback(async (savedPolicyId: number, applied: boolean) => {
    if (applied) {
      await authenticatedRequest(`/api/app/users/me/saved-policies/${savedPolicyId}/applied`, {
        body: { applied: true },
        method: 'POST',
      });
    } else {
      await authenticatedRequest(`/api/app/users/me/saved-policies/${savedPolicyId}`, {
        method: 'DELETE',
      });
    }

    await refreshData();
  }, [authenticatedRequest, refreshData]);

  const toggleTodo = useCallback(async (todoId: number, isChecked: boolean) => {
    setTodoPrograms((current) => current.map((program) => ({
      ...program,
      documents: program.documents.map((document) =>
        document.todoId === todoId ? { ...document, isChecked } : document,
      ),
    })));

    try {
      await authenticatedRequest(`/api/app/users/me/todos/${todoId}`, {
        body: { is_checked: isChecked },
        method: 'PATCH',
      });
    } catch (error) {
      setTodoPrograms((current) => current.map((program) => ({
        ...program,
        documents: program.documents.map((document) =>
          document.todoId === todoId ? { ...document, isChecked: !isChecked } : document,
        ),
      })));
      throw error;
    }
  }, [authenticatedRequest]);

  const savedPrograms = useMemo(() => savedPolicies.map(mapSavedProgram), [savedPolicies]);
  const calendarEvents = useMemo(() => savedPolicies.flatMap(mapCalendarEvents), [savedPolicies]);
  const visibleNotifications = useMemo(() => (
    notifications.filter((notification) => !dismissedNotifications[notification.id])
  ), [dismissedNotifications, notifications]);

  const value = useMemo<AppDataContextValue>(() => ({
    answerExpiredPolicy,
    calendarEvents,
    dismissAllNotifications,
    dismissNotification,
    hasUnreadNotifications,
    loadNotifications,
    loading,
    notifications: visibleNotifications,
    refreshData,
    savedPrograms,
    todoPrograms,
    toggleTodo,
  }), [
    answerExpiredPolicy,
    calendarEvents,
    dismissAllNotifications,
    dismissNotification,
    hasUnreadNotifications,
    loadNotifications,
    loading,
    refreshData,
    savedPrograms,
    todoPrograms,
    toggleTodo,
    visibleNotifications,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }

  return context;
}
