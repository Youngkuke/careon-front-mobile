import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  type ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';

type ScreenProps = PropsWithChildren<{
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  scroll?: boolean;
}>;

const DEFAULT_SCREEN_EDGES: Edge[] = ['top', 'right', 'left'];

type CareScrollViewProps = ScrollViewProps & {
  contentContainerStyle?: StyleProp<ViewStyle>;
  showCareScrollbar?: boolean;
};

type CareEntranceProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function CareEntrance({
  children,
  delay = 0,
  distance = 12,
  style,
}: CareEntranceProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(progress, {
        damping: 18,
        mass: 0.8,
        stiffness: 150,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

export function CareScrollView({
  children,
  contentContainerStyle,
  onContentSizeChange,
  onLayout,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  scrollEventThrottle = 16,
  showCareScrollbar = true,
  style,
  ...props
}: CareScrollViewProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewportHeight, setViewportHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  const canScroll = contentHeight > viewportHeight + 2;
  const thumbHeight = Math.max(36, (viewportHeight / contentHeight) * viewportHeight);
  const maxThumbTranslate = Math.max(0, viewportHeight - thumbHeight - 12);
  const maxScroll = Math.max(1, contentHeight - viewportHeight);
  const thumbTranslateY = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, maxScroll],
    outputRange: [0, maxThumbTranslate],
  });

  const showIndicator = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (!canScroll) {
      return;
    }

    Animated.timing(indicatorOpacity, {
      duration: 160,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideIndicator = () => {
    hideTimer.current = setTimeout(() => {
      Animated.timing(indicatorOpacity, {
        duration: 320,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }, 420);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.setValue(event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  };

  return (
    <View style={[styles.scrollFrame, style]}>
      <Animated.ScrollView
        {...props}
        contentContainerStyle={contentContainerStyle}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
          onContentSizeChange?.(width, height);
        }}
        onLayout={(event) => {
          setViewportHeight(event.nativeEvent.layout.height);
          onLayout?.(event);
        }}
        onMomentumScrollEnd={(event) => {
          hideIndicator();
          onMomentumScrollEnd?.(event);
        }}
        onScroll={handleScroll}
        onScrollBeginDrag={(event) => {
          showIndicator();
          onScrollBeginDrag?.(event);
        }}
        onScrollEndDrag={(event) => {
          hideIndicator();
          onScrollEndDrag?.(event);
        }}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {children}
      </Animated.ScrollView>
      {showCareScrollbar && canScroll ? (
        <View pointerEvents="none" style={styles.scrollbarTrack}>
          <Animated.View
            style={[
              styles.scrollbarThumb,
              {
                height: thumbHeight,
                opacity: indicatorOpacity,
                transform: [{ translateY: thumbTranslateY }],
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export function Screen({
  children,
  backgroundColor = CAREON_COLORS.background,
  contentStyle,
  edges = DEFAULT_SCREEN_EDGES,
  scroll,
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }]}>
        <CareScrollView
          bounces={false}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled">
          {children}
        </CareScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }]}>
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
  scrollFrame: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollbarTrack: {
    backgroundColor: 'rgba(36, 200, 152, 0.1)',
    borderRadius: 999,
    bottom: 12,
    position: 'absolute',
    right: 6,
    top: 12,
    width: 4,
  },
  scrollbarThumb: {
    backgroundColor: CAREON_COLORS.primary,
    borderRadius: 999,
    width: 4,
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
