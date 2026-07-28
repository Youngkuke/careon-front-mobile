import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import MapView, { Circle, Region } from 'react-native-maps';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { useSaveFeedback } from '@/lib/save-feedback-state';
import { SafeZone, useWear } from '@/lib/wear-state';

const RADIUS = [100, 150, 300, 500] as const;
const DEFAULT_CENTER = { latitude: 37.4965, longitude: 126.9572 };
const MAP_DELTA = 0.012;
const CURRENT_LOCATION_TIMEOUT_MS = 20_000;

const toRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  latitudeDelta: MAP_DELTA,
  longitudeDelta: MAP_DELTA,
});

function getCurrentLocationWithTimeout() {
  return new Promise<Location.LocationObject>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('현재 위치 확인 시간이 초과됐어요.')), CURRENT_LOCATION_TIMEOUT_MS);
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, mayShowUserSettingsDialog: false })
      .then(resolve, reject)
      .finally(() => clearTimeout(timeout));
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : '알 수 없는 위치 오류';
}

export default function SafeZoneScreen() {
  const { safeZone, saveSafeZone } = useWear();
  const mapRef = useRef<MapView>(null);
  const [enabled, setEnabled] = useState(safeZone.enabled);
  const [name, setName] = useState(safeZone.name);
  const [radius, setRadius] = useState<SafeZone['radiusMeters']>(safeZone.radiusMeters);
  const [center, setCenter] = useState({
    latitude: safeZone.latitude ?? DEFAULT_CENTER.latitude,
    longitude: safeZone.longitude ?? DEFAULT_CENTER.longitude,
  });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'denied' | 'fallback' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showSaved } = useSaveFeedback();

  // The provider loads the saved zone asynchronously. `initialRegion` is read only
  // on the first render, so move the already-mounted map when that data arrives.
  useEffect(() => {
    const nextCenter = {
      latitude: safeZone.latitude ?? DEFAULT_CENTER.latitude,
      longitude: safeZone.longitude ?? DEFAULT_CENTER.longitude,
    };
    setCenter(nextCenter);
    mapRef.current?.animateToRegion(toRegion(nextCenter.latitude, nextCenter.longitude), 0);
  }, [safeZone.id, safeZone.latitude, safeZone.longitude]);

  const setCurrentLocation = async () => {
    setLocationStatus('loading');
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      if (!await Location.hasServicesEnabledAsync()) {
        setLocationStatus('error');
        setLocationError('기기 위치 서비스가 꺼져 있어요.');
        return;
      }

      const location = await getCurrentLocationWithTimeout();
      const nextCenter = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setCenter(nextCenter);
      mapRef.current?.animateToRegion(toRegion(nextCenter.latitude, nextCenter.longitude), 350);
      setLocationStatus('idle');
    } catch (error) {
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60 * 60_000, requiredAccuracy: 100 }).catch(() => null);
      if (lastKnown) {
        const nextCenter = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        setCenter(nextCenter);
        mapRef.current?.animateToRegion(toRegion(nextCenter.latitude, nextCenter.longitude), 350);
        setLocationStatus('fallback');
        return;
      }
      setLocationStatus('error');
      setLocationError(errorMessage(error));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveSafeZone({
        ...safeZone,
        enabled,
        name: name.trim() || '안심 구역',
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters: radius,
      });
      showSaved();
      replaceRoute('/wear');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '안심 구역을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
      <Header onBack={() => replaceRoute('/wear')} style={styles.header} title="안심 구역 설정" />

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>안심 구역 사용</Text>
          </View>
          <Switch
            ios_backgroundColor={CAREON_COLORS.line}
            onValueChange={setEnabled}
            thumbColor={CAREON_COLORS.background}
            trackColor={{ false: CAREON_COLORS.line, true: CAREON_COLORS.primary }}
            value={enabled}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>구역 이름</Text>
        <TextInput
          onChangeText={setName}
          placeholder="예: 집"
          placeholderTextColor={CAREON_COLORS.faint}
          style={styles.input}
          value={name}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.label}>중심 위치</Text>
            <Text style={styles.hint}>지도를 움직여 핀 위치를 정해주세요</Text>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <MapView
            initialRegion={toRegion(center.latitude, center.longitude)}
            onRegionChangeComplete={({ latitude, longitude }) => setCenter({ latitude, longitude })}
            ref={mapRef}
            style={styles.map}>
            <Circle
              center={center}
              fillColor="rgba(36, 200, 152, 0.18)"
              radius={radius}
              strokeColor={CAREON_COLORS.primary}
              strokeWidth={2}
            />
          </MapView>
          <View pointerEvents="none" style={styles.centerPin}>
            <Ionicons color={CAREON_COLORS.primaryDark} name="location" size={34} />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={locationStatus === 'loading'}
            onPress={setCurrentLocation}
            style={({ pressed }) => [styles.locationButton, pressed && styles.pressed, locationStatus === 'loading' && styles.disabled]}>
            {locationStatus === 'loading' ? <ActivityIndicator color={CAREON_COLORS.title} size="small" /> : <Ionicons color={CAREON_COLORS.title} name="locate-outline" size={29} />}
          </Pressable>
        </View>

        <Text style={styles.coordinate}>
          {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
        </Text>
        {locationStatus === 'denied' ? <Text style={styles.errorText}>위치 권한이 거부되었어요. 지도를 이동해 직접 중심 위치를 정해주세요.</Text> : null}
        {locationStatus === 'fallback' ? <Text style={styles.locationGuide}>현재 위치 응답이 늦어 최근 GPS 위치로 설정했어요. 좌표를 확인한 뒤 저장해주세요.</Text> : null}
        {locationStatus === 'error' ? <Text style={styles.errorText}>현재 위치를 불러오지 못했어요. 지도를 이동해 직접 중심 위치를 정해주세요.{__DEV__ && locationError ? `\n원인: ${locationError}` : ''}</Text> : null}
        <Text style={styles.radiusLabel}>반경</Text>
        <View style={styles.choices}>
          {RADIUS.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              onPress={() => setRadius(value)}
              style={[styles.choice, radius === value && styles.choiceActive]}>
              <Text style={[styles.choiceText, radius === value && styles.choiceTextActive]}>{value}m</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <CareButton disabled={saving} onPress={() => void save()}>{saving ? '저장 중' : '저장'}</CareButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 20 },
  header: { marginBottom: 14, marginHorizontal: -24 },
  card: { backgroundColor: CAREON_COLORS.background, borderRadius: 22, marginBottom: 16, padding: 18, ...CAREON_SHADOW },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rowText: { flex: 1, paddingRight: 16 },
  label: { color: CAREON_COLORS.title, fontSize: 16, fontWeight: '900' },
  hint: { color: CAREON_COLORS.muted, fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 4 },
  input: { borderBottomColor: CAREON_COLORS.line, borderBottomWidth: 1, color: CAREON_COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 10, paddingVertical: 10 },
  mapHeader: { marginBottom: 13 },
  locationButton: { alignItems: 'center', backgroundColor: CAREON_COLORS.background, borderRadius: 28, bottom: 16, elevation: 5, height: 56, justifyContent: 'center', position: 'absolute', right: 16, shadowColor: '#444444', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 7, width: 56 },
  mapWrap: { borderRadius: 16, height: 248, overflow: 'hidden' },
  map: { height: '100%', width: '100%' },
  centerPin: { alignItems: 'center', justifyContent: 'center', left: '50%', marginLeft: -17, marginTop: -34, position: 'absolute', top: '50%' },
  coordinate: { color: CAREON_COLORS.primaryDark, fontSize: 13, fontVariant: ['tabular-nums'], fontWeight: '800', marginTop: 12 },
  locationGuide: { color: CAREON_COLORS.muted, fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 5 },
  errorText: { color: CAREON_COLORS.danger, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 5 },
  radiusLabel: { color: CAREON_COLORS.title, fontSize: 16, fontWeight: '900', marginTop: 20 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  choice: { borderColor: CAREON_COLORS.line, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  choiceActive: { backgroundColor: CAREON_COLORS.primary, borderColor: CAREON_COLORS.primary },
  choiceText: { color: CAREON_COLORS.muted, fontSize: 13, fontWeight: '800' },
  choiceTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
});
