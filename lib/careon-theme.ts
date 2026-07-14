import { Platform } from 'react-native';

export const CAREON_COLORS = {
  background: '#FFFFFF',
  page: '#F6F6F6',
  title: '#444444',
  text: '#575757',
  muted: '#878787',
  faint: '#A1A1A1',
  line: '#DDDDDD',
  input: '#EBEBEB',
  primary: '#24C898',
  primaryDark: '#0BB985',
  danger: '#FF777B',
  blue: '#4CACFF',
};

export const CAREON_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  android: {
    elevation: 4,
  },
  default: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
}) ?? {};
