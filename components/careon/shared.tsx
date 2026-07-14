import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';

type ScreenProps = PropsWithChildren<{
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

export function Screen({ children, backgroundColor = CAREON_COLORS.background, contentStyle, scroll }: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

type HeaderProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Header({ title, onBack, right, style }: HeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <Pressable accessibilityLabel="뒤로가기" hitSlop={12} onPress={onBack} style={styles.backButton}>
            <Ionicons color={CAREON_COLORS.text} name="chevron-back" size={25} />
          </Pressable>
        ) : null}
        {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
      </View>
      {right}
    </View>
  );
}

type CareButtonProps = PropsWithChildren<{
  onPress?: () => void;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'white' | 'dangerText';
  style?: StyleProp<ViewStyle>;
}>;

export function CareButton({ children, onPress, style, textStyle, variant = 'primary' }: CareButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'dangerText';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primaryButton : styles.whiteButton,
        pressed && styles.pressed,
        style,
      ]}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.buttonText, isPrimary && styles.primaryButtonText, isDanger && styles.dangerButtonText, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={CAREON_COLORS.faint}
        selectionColor={CAREON_COLORS.primary}
        style={[styles.fieldInput, style]}
        {...props}
      />
    </View>
  );
}

type ProfileRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  accessory?: ReactNode;
};

export function ProfileRow({ label, value, onPress, accessory }: ProfileRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.profileRow, pressed && styles.rowPressed]}>
      <Text style={styles.profileLabel}>{label}</Text>
      <View style={styles.profileValueWrap}>
        {value ? <Text numberOfLines={1} style={styles.profileValue}>{value}</Text> : null}
        {accessory}
      </View>
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function CheckLine({ title, guide }: { title: string; guide: string }) {
  return (
    <View style={styles.checkLine}>
      <Ionicons color={CAREON_COLORS.primary} name="checkbox-outline" size={18} />
      <View style={styles.checkText}>
        <Text style={styles.checkTitle}>{title}</Text>
        <Text style={styles.checkGuide}>{guide}</Text>
      </View>
    </View>
  );
}

export const sharedStyles = {
  cardShadow: CAREON_SHADOW,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 24,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  backButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginLeft: -4,
    width: 24,
  },
  headerTitle: {
    color: CAREON_COLORS.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    height: 49,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: CAREON_COLORS.primary,
  },
  whiteButton: {
    backgroundColor: CAREON_COLORS.background,
    ...CAREON_SHADOW,
  },
  pressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: CAREON_COLORS.primaryDark,
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: CAREON_COLORS.background,
  },
  dangerButtonText: {
    color: CAREON_COLORS.danger,
  },
  fieldBlock: {
    gap: 10,
  },
  fieldLabel: {
    color: CAREON_COLORS.title,
    fontSize: 15,
    fontWeight: '500',
  },
  fieldInput: {
    backgroundColor: CAREON_COLORS.input,
    borderRadius: 11,
    color: CAREON_COLORS.title,
    fontSize: 16,
    height: 47,
    paddingHorizontal: 16,
  },
  profileRow: {
    alignItems: 'center',
    borderBottomColor: CAREON_COLORS.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 59,
    paddingHorizontal: 36,
  },
  rowPressed: {
    backgroundColor: '#FAFAFA',
  },
  profileLabel: {
    color: CAREON_COLORS.title,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  profileValueWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    maxWidth: '54%',
  },
  profileValue: {
    color: CAREON_COLORS.muted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'right',
  },
  divider: {
    backgroundColor: CAREON_COLORS.line,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 25,
  },
  checkLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  checkText: {
    gap: 5,
  },
  checkTitle: {
    color: CAREON_COLORS.title,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  checkGuide: {
    color: CAREON_COLORS.text,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
  },
});
