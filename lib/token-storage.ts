import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'careon.accessToken';
const REFRESH_TOKEN_KEY = 'careon.refreshToken';
const PUSH_TOKEN_KEY = 'careon.pushToken';

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    getItem(ACCESS_TOKEN_KEY),
    getItem(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function saveStoredTokens(tokens: StoredTokens) {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearStoredTokens() {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
  ]);
}

export async function getStoredPushToken() {
  return getItem(PUSH_TOKEN_KEY);
}

export async function saveStoredPushToken(token: string) {
  await setItem(PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken() {
  await deleteItem(PUSH_TOKEN_KEY);
}
