import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  ApiError,
  apiRequest,
  careonApi,
  normalizeUserMeResponse,
  toUpdateUserRequest,
  UserMeResponse,
  type UpdateUserPayload,
  type UserMeApiResponse,
} from './api';
import { clearStoredPushToken, clearStoredTokens, getStoredPushToken, getStoredTokens, saveStoredTokens, type StoredTokens } from './token-storage';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'guest';

type AuthContextValue = {
  authenticatedRequest: <T>(path: string, options?: { body?: unknown; method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' }) => Promise<T>;
  deleteAccount: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  status: AuthStatus;
  updateMe: (payload: UpdateUserPayload) => Promise<void>;
  user: UserMeResponse | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [, setTokens] = useState<StoredTokens | null>(null);
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const tokensRef = useRef<StoredTokens | null>(null);
  const refreshPromiseRef = useRef<Promise<StoredTokens> | null>(null);

  const applyTokens = useCallback(async (nextTokens: StoredTokens) => {
    tokensRef.current = nextTokens;
    setTokens(nextTokens);
    await saveStoredTokens(nextTokens);
  }, []);

  const clearSession = useCallback(async () => {
    tokensRef.current = null;
    setTokens(null);
    setUser(null);
    setStatus('guest');
    await Promise.all([clearStoredTokens(), clearStoredPushToken()]);
  }, []);

  const refreshTokens = useCallback((refreshToken: string) => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = careonApi.refresh(refreshToken)
        .then(async (nextTokens) => {
          await applyTokens(nextTokens);

          return nextTokens;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [applyTokens]);

  const requestWithAuth = useCallback<AuthContextValue['authenticatedRequest']>(async (path, options = {}) => {
    const activeTokens = tokensRef.current;

    if (!activeTokens) {
      throw new ApiError('로그인이 필요합니다.', 401);
    }

    try {
      return await apiRequest(path, { ...options, accessToken: activeTokens.accessToken });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }

      let nextTokens: StoredTokens;

      try {
        nextTokens = await refreshTokens(activeTokens.refreshToken);
      } catch (refreshError) {
        await clearSession();
        throw refreshError;
      }

      try {
        return await apiRequest(path, { ...options, accessToken: nextTokens.accessToken });
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401) {
          await clearSession();
        }

        throw retryError;
      }
    }
  }, [clearSession, refreshTokens]);

  const unregisterPushToken = useCallback(async () => {
    const pushToken = await getStoredPushToken();
    if (!pushToken) return;
    try {
      await requestWithAuth('/api/app/users/me/push-tokens', {
        body: { token: pushToken },
        method: 'DELETE',
      });
    } finally {
      await clearStoredPushToken();
    }
  }, [requestWithAuth]);

  const refreshMe = useCallback(async () => {
    const nextUser = await requestWithAuth<UserMeApiResponse>('/api/app/users/me');
    setUser(normalizeUserMeResponse(nextUser));
    setStatus('authenticated');
  }, [requestWithAuth]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const storedTokens = await getStoredTokens();

        if (!storedTokens) {
          if (mounted) {
            setStatus('guest');
          }
          return;
        }

        if (mounted) {
          tokensRef.current = storedTokens;
          setTokens(storedTokens);
        }

        let activeTokens = storedTokens;
        let nextUser: UserMeResponse;

        try {
          nextUser = await careonApi.getMe(activeTokens.accessToken);
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) {
            throw error;
          }

          activeTokens = await refreshTokens(storedTokens.refreshToken);
          nextUser = await careonApi.getMe(activeTokens.accessToken);
        }

        if (mounted) {
          tokensRef.current = activeTokens;
          setTokens(activeTokens);
          setUser(nextUser);
          setStatus('authenticated');
        }
      } catch {
        if (mounted) {
          await clearSession();
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [clearSession, refreshTokens]);

  const login = useCallback(async (email: string, password: string) => {
    const nextTokens = await careonApi.login(email, password);
    await applyTokens(nextTokens);
    const nextUser = await careonApi.getMe(nextTokens.accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, [applyTokens]);

  const logout = useCallback(async () => {
    const activeTokens = tokensRef.current;

    if (activeTokens?.accessToken) {
      try {
        await unregisterPushToken();
        await requestWithAuth('/api/app/users/logout', { method: 'POST' });
      } catch {
        // Local logout should still succeed if the server session is already gone.
      }
    }

    await clearSession();
  }, [clearSession, requestWithAuth, unregisterPushToken]);

  const updateMe = useCallback(async (payload: UpdateUserPayload) => {
    await requestWithAuth('/api/app/users/me', { body: toUpdateUserRequest(payload), method: 'PATCH' });
    await refreshMe();
  }, [refreshMe, requestWithAuth]);

  const deleteAccount = useCallback(async () => {
    await unregisterPushToken();
    await requestWithAuth('/api/app/users/me', { method: 'DELETE' });
    await clearSession();
  }, [clearSession, requestWithAuth, unregisterPushToken]);

  const value = useMemo<AuthContextValue>(() => ({
    authenticatedRequest: requestWithAuth,
    deleteAccount,
    login,
    logout,
    refreshMe,
    status,
    updateMe,
    user,
  }), [deleteAccount, login, logout, refreshMe, requestWithAuth, status, updateMe, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
