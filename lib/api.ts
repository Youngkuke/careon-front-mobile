export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type LoginResponse = {
  carerId: number;
  userId: number;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type UserMeResponse = {
  userId: number;
  name: string;
  email: string;
  region: string;
  notificationEnabled: boolean;
};

export type UpdateUserPayload = Partial<{
  name: string;
  email: string;
  password: string;
  region: string;
  notificationEnabled: boolean;
}>;

export type SavedPolicyResponse = {
  saved_policy_id: number;
  policy_id: number;
  policy_name: string;
  application_deadline: string | null;
  application_deadline_d_day: string | null;
  documents: string[];
  result_date: string | null;
  result_date_d_day: string | null;
};

export type NotificationResponse = {
  notification_id: number;
  saved_policy_id: number;
  policy_id: number;
  policy_name: string;
  notification_type: 'DEADLINE_D7' | 'DEADLINE_D3' | 'DEADLINE_D1' | 'RESULT_DDAY';
  sent_at: string;
  is_read: boolean;
  relative_time: string;
};

export type TodoPolicyResponse = {
  saved_policy_id: number;
  policy_id: number;
  policy_name: string;
  application_deadline: string | null;
  link: string | null;
  is_expired: boolean;
  is_applied?: boolean;
  documents: Array<{
    todo_id: number;
    document_id: number;
    document_name: string;
    issuers: Array<{
      document_issuer_id: number;
      issuer_name: string;
      issuer_site: string | null;
    }>;
    is_checked: boolean;
  }>;
};

type LoginApiResponse = {
  carer_id: number;
  access_token: string;
  refresh_token: string;
  refresh_token_expires_at: string;
};

type RefreshApiResponse = Omit<LoginApiResponse, 'carer_id'>;

export type UserMeApiResponse = {
  carer_id: number;
  name: string;
  email: string;
  region: string;
  notification_enabled: boolean;
};

type UpdateUserRequest = Partial<{
  name: string;
  email: string;
  password: string;
  region: string;
  notification_enabled: boolean;
}>;

type RequestOptions = {
  accessToken?: string;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError('EXPO_PUBLIC_API_BASE_URL 환경변수를 설정해주세요.', 0);
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  assertApiBaseUrl();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    method: options.method ?? 'GET',
  });
  const body = await readResponseBody(response);

  if (!response.ok) {
    const message = typeof body === 'object' && body && 'message' in body
      ? String((body as { message: unknown }).message)
      : '요청을 처리하지 못했어요.';

    throw new ApiError(message, response.status);
  }

  return body as T;
}

function normalizeLoginResponse(response: LoginApiResponse): LoginResponse {
  return {
    accessToken: response.access_token,
    carerId: response.carer_id,
    refreshToken: response.refresh_token,
    refreshTokenExpiresAt: response.refresh_token_expires_at,
    userId: response.carer_id,
  };
}

function normalizeRefreshResponse(response: RefreshApiResponse): RefreshResponse {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    refreshTokenExpiresAt: response.refresh_token_expires_at,
  };
}

export function normalizeUserMeResponse(response: UserMeApiResponse): UserMeResponse {
  return {
    email: response.email,
    name: response.name,
    notificationEnabled: response.notification_enabled,
    region: response.region,
    userId: response.carer_id,
  };
}

export function toUpdateUserRequest(payload: UpdateUserPayload): UpdateUserRequest {
  return {
    email: payload.email,
    name: payload.name,
    notification_enabled: payload.notificationEnabled,
    password: payload.password,
    region: payload.region,
  };
}

export const careonApi = {
  deleteMe: (accessToken: string) =>
    apiRequest<{ message: string }>('/api/app/users/me', { accessToken, method: 'DELETE' }),
  getMe: (accessToken: string) =>
    apiRequest<UserMeApiResponse>('/api/app/users/me', { accessToken }).then(normalizeUserMeResponse),
  getNotifications: (accessToken: string) =>
    apiRequest<NotificationResponse[]>('/api/app/users/me/notifications', { accessToken }),
  getUnreadNotificationCount: (accessToken: string) =>
    apiRequest<{ unread_count: number }>('/api/app/users/me/notifications/unread-count', { accessToken }),
  getSavedPolicies: (accessToken: string) =>
    apiRequest<SavedPolicyResponse[]>('/api/app/users/me/saved-policies', { accessToken }),
  getTodos: (accessToken: string) =>
    apiRequest<TodoPolicyResponse[]>('/api/app/users/me/todos', { accessToken }),
  markSavedPolicyApplied: (accessToken: string, savedPolicyId: number) =>
    apiRequest<{ message: string }>(`/api/app/users/me/saved-policies/${savedPolicyId}/applied`, {
      accessToken,
      body: { applied: true },
      method: 'POST',
    }),
  login: (email: string, password: string) =>
    apiRequest<LoginApiResponse>('/api/app/users/login', {
      body: { email, password },
      method: 'POST',
    }).then(normalizeLoginResponse),
  logout: (accessToken: string) =>
    apiRequest<{ message: string }>('/api/app/users/logout', { accessToken, method: 'POST' }),
  markAllNotificationsRead: (accessToken: string) =>
    apiRequest<{ updated_count: number; message: string }>('/api/app/users/me/notifications/read-all', {
      accessToken,
      method: 'PATCH',
    }),
  refresh: (refreshToken: string) =>
    apiRequest<RefreshApiResponse>('/api/app/users/refresh', {
      body: { refresh_token: refreshToken },
      method: 'POST',
    }).then(normalizeRefreshResponse),
  toggleTodo: (accessToken: string, todoId: number, isChecked: boolean) =>
    apiRequest<{ todo_id: number; is_checked: boolean; message: string }>(`/api/app/users/me/todos/${todoId}`, {
      accessToken,
      body: { is_checked: isChecked },
      method: 'PATCH',
    }),
  unsavePolicy: (accessToken: string, savedPolicyId: number) =>
    apiRequest<{ message: string }>(`/api/app/users/me/saved-policies/${savedPolicyId}`, {
      accessToken,
      method: 'DELETE',
    }),
  updateMe: (accessToken: string, payload: UpdateUserPayload) =>
    apiRequest<{ message: string }>('/api/app/users/me', {
      accessToken,
      body: toUpdateUserRequest(payload),
      method: 'PATCH',
    }),
};
