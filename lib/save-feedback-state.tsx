import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { CAREON_COLORS, CAREON_SHADOW } from './careon-theme';

type SaveFeedbackContextValue = { showSaved: () => void };

const SaveFeedbackContext = createContext<SaveFeedbackContextValue | null>(null);

export function SaveFeedbackProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSaved = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    setVisible(true);
    progress.setValue(0);
    Animated.spring(progress, { damping: 18, mass: 0.7, stiffness: 220, toValue: 1, useNativeDriver: true }).start();
    timeout.current = setTimeout(() => {
      Animated.timing(progress, { duration: 180, toValue: 0, useNativeDriver: true }).start(() => setVisible(false));
    }, 1_700);
  }, [progress]);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  return <SaveFeedbackContext.Provider value={{ showSaved }}><View style={styles.root}>{children}{visible ? <Animated.View pointerEvents="none" style={[styles.toast, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}><Text style={styles.text}>수정되었습니다</Text></Animated.View> : null}</View></SaveFeedbackContext.Provider>;
}

export function useSaveFeedback() {
  const value = useContext(SaveFeedbackContext);
  if (!value) throw new Error('SaveFeedbackProvider가 필요합니다.');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toast: { alignSelf: 'center', backgroundColor: 'rgba(68, 68, 68, 0.72)', borderRadius: 22, bottom: '12%', paddingHorizontal: 22, paddingVertical: 13, position: 'absolute', ...CAREON_SHADOW },
  text: { color: CAREON_COLORS.background, fontSize: 14, fontWeight: '800' },
});
