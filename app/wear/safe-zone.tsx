import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import MapView, { Circle, Region } from 'react-native-maps';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { SafeZone, useWear } from '@/lib/wear-state';

const RADIUS = [100, 150, 300, 500] as const;
const DEFAULT_CENTER = { latitude: 37.4965, longitude: 126.9572 };
const MAP_DELTA = 0.012;

const toRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  latitudeDelta: MAP_DELTA,
  longitudeDelta: MAP_DELTA,
});

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
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'denied' | 'error'>('idle');

  const setCurrentLocation = async () => {
    setLocationStatus('loading');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextCenter = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setCenter(nextCenter);
      mapRef.current?.animateToRegion(toRegion(nextCenter.latitude, nextCenter.longitude), 350);
      setLocationStatus('idle');
    } catch {
      setLocationStatus('error');
    }
  };

  const save = () => {
    saveSafeZone({
      ...safeZone,
      enabled,
      name: name.trim() || '안심 구역',
      latitude: center.latitude,
      longitude: center.longitude,
      radiusMeters: radius,
    });
    replaceRoute('/wear');
  };

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
      <Header onBack={() => replaceRoute('/wear')} style={styles.header} title="안심 구역 설정" />

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>안심 구역 사용</Text>
            <Text style={styles.hint}>한 명당 한 개의 원형 구역을 설정할 수 있어요</Text>
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
          <Pressable
            accessibilityRole="button"
            disabled={locationStatus === 'loading'}
            onPress={setCurrentLocation}
            style={({ pressed }) => [styles.locationButton, pressed && styles.pressed, locationStatus === 'loading' && styles.disabled]}>
            {locationStatus === 'loading' ? <ActivityIndicator color={CAREON_COLORS.primaryDark} size="small" /> : <Ionicons color={CAREON_COLORS.primaryDark} name="locate-outline" size={17} />}
            <Text style={styles.locationButtonText}>현재 위치로 설정</Text>
          </Pressable>
        </View>

        <View style={styles.mapWrap}>
          <MapView
            initialRegion={toRegion(center.latitude, center.longitude)}
            onRegionChangeComplete={({ latitude, longitude }) => setCenter({ latitude, longitude })}
            ref={mapRef}
            style={styles.map}>
            <Circle
              center={center}
              fillColor="rgba(50, 190, 145, 0.18)"
              radius={radius}
              strokeColor={CAREON_COLORS.primary}
              strokeWidth={2}
            />
          </MapView>
          <View pointerEvents="none" style={styles.centerPin}>
            <Ionicons color={CAREON_COLORS.primaryDark} name="location" size={34} />
          </View>
        </View>

        <Text style={styles.coordinate}>
          {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
        </Text>
        {locationStatus === 'idle' ? <Text style={styles.locationGuide}>현재 위치를 설정하려면 위치 권한이 필요해요.</Text> : null}
        {locationStatus === 'denied' ? <Text style={styles.errorText}>위치 권한이 거부되었어요. 지도를 이동해 직접 중심 위치를 정해주세요.</Text> : null}
        {locationStatus === 'error' ? <Text style={styles.errorText}>현재 위치를 불러오지 못했어요. 지도를 이동해 중심 위치를 정해주세요.</Text> : null}

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

      <CareButton onPress={save}>저장</CareButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 20 },
  header: { marginHorizontal: -24 },
  card: { backgroundColor: CAREON_COLORS.background, borderRadius: 22, marginBottom: 16, padding: 18, ...CAREON_SHADOW },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rowText: { flex: 1, paddingRight: 16 },
  label: { color: CAREON_COLORS.title, fontSize: 16, fontWeight: '900' },
  hint: { color: CAREON_COLORS.muted, fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 4 },
  input: { borderBottomColor: CAREON_COLORS.line, borderBottomWidth: 1, color: CAREON_COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 10, paddingVertical: 10 },
  mapHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  locationButton: { alignItems: 'center', backgroundColor: '#E7F8F2', borderRadius: 12, flexDirection: 'row', gap: 4, minHeight: 36, paddingHorizontal: 10 },
  locationButtonText: { color: CAREON_COLORS.primaryDark, fontSize: 12, fontWeight: '800' },
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
  choiceTextActive: { color: '#FFF' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
});
