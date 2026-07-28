import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';

import { CareButton, CareEntrance, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { useWear } from '@/lib/wear-state';

const DEFAULT_CENTER = { latitude: 37.4965, longitude: 126.9572 };
const REGION_DELTA = 0.018;

export default function TrackingScreen() {
  const { liveLocation, liveLocationTrackingEnabled, liveLocationTrackingExpiresAt, safeZone, setLiveLocationTracking, setTrackingScreenActive } = useWear();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFollowingWatch, setIsFollowingWatch] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);
  const center = safeZone.enabled
    ? { latitude: safeZone.latitude, longitude: safeZone.longitude }
    : DEFAULT_CENTER;
  const region = { ...center, latitudeDelta: REGION_DELTA, longitudeDelta: REGION_DELTA };
  const focusWatch = useCallback((animated = true) => {
    if (!liveLocation) return;
    const watchRegion: Region = {
      latitude: liveLocation.latitude,
      longitude: liveLocation.longitude,
      latitudeDelta: 0.007,
      longitudeDelta: 0.007,
    };
    if (animated) mapRef.current?.animateToRegion(watchRegion, 700);
    else mapRef.current?.animateToRegion(watchRegion, 0);
  }, [liveLocation]);
  useFocusEffect(useCallback(() => {
    setTrackingScreenActive(true);
    return () => setTrackingScreenActive(false);
  }, [setTrackingScreenActive]));
  useEffect(() => {
    if (liveLocation && isFollowingWatch && isMapReady) focusWatch();
  }, [focusWatch, isFollowingWatch, isMapReady, liveLocation]);
  const toggleTracking = async () => {
    setIsUpdating(true);
    try { await setLiveLocationTracking(!liveLocationTrackingEnabled, 60); }
    catch (error) { Alert.alert('위치 추적 설정 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'); }
    finally { setIsUpdating(false); }
  };

  return (
    <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
      <Text style={styles.title}>실시간 위치</Text>

      <CareEntrance delay={150}>
        <View style={styles.mapCard}>
          <View style={styles.mapArea}>
            <MapView
              initialRegion={region}
              onMapReady={() => setIsMapReady(true)}
              onPanDrag={() => setIsFollowingWatch(false)}
              ref={mapRef}
              style={styles.map}>
              {safeZone.enabled ? (
                <Circle
                  center={center}
                  fillColor="rgba(36, 200, 152, 0.14)"
                  radius={safeZone.radiusMeters}
                  strokeColor={CAREON_COLORS.primary}
                  strokeWidth={2}
                />
              ) : null}
              {liveLocation ? <Marker coordinate={liveLocation} title="워치 위치">
                <View style={styles.marker}><Ionicons color={CAREON_COLORS.background} name="watch-outline" size={18} /></View>
              </Marker> : null}
            </MapView>
            <Pressable
              accessibilityLabel="워치 위치로 지도 이동"
              disabled={!liveLocation}
              onPress={() => { setIsFollowingWatch(true); focusWatch(); }}
              style={[styles.locateButton, !liveLocation && styles.locateButtonDisabled]}>
              <Ionicons color={liveLocation ? CAREON_COLORS.title : CAREON_COLORS.faint} name="locate-outline" size={29} />
            </Pressable>
          </View>
          <View style={styles.mapCaption}>
            <View style={styles.captionIcon}><Ionicons color={CAREON_COLORS.primaryDark} name="watch-outline" size={16} /></View>
            <View style={styles.captionTextWrap}><Text style={styles.captionTitle}>CareOn 워치</Text></View>
            <View style={[styles.status, liveLocationTrackingEnabled && styles.statusActive]}><Text style={[styles.statusText, liveLocationTrackingEnabled && styles.statusTextActive]}>{liveLocationTrackingEnabled ? '추적 중' : '대기 중'}</Text></View>
          </View>
        </View>
      </CareEntrance>

      <CareEntrance delay={220}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}><Ionicons color={CAREON_COLORS.primaryDark} name="time-outline" size={21} /><Text style={styles.infoLabel}>최근 위치 갱신</Text><Text style={styles.infoValue}>{liveLocation ? new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(liveLocation.capturedAt)) : '추적 전'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Ionicons color={CAREON_COLORS.primaryDark} name="navigate-outline" size={21} /><Text style={styles.infoLabel}>위치 정확도</Text><Text style={styles.infoValue}>{liveLocation?.accuracyMeters != null ? `± ${Math.round(liveLocation.accuracyMeters)}m` : '—'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Ionicons color={CAREON_COLORS.primaryDark} name="hourglass-outline" size={21} /><Text style={styles.infoLabel}>추적 종료 예정</Text><Text style={styles.infoValue}>{liveLocationTrackingEnabled && liveLocationTrackingExpiresAt ? new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(liveLocationTrackingExpiresAt)) : '추적 안 함'}</Text></View>
        </View>
      </CareEntrance>

      <CareEntrance delay={290}>
        <CareButton disabled={isUpdating} onPress={() => void toggleTracking()} style={styles.trackingButton} variant={liveLocationTrackingEnabled ? 'white' : undefined}>
          {isUpdating ? '설정 중' : liveLocationTrackingEnabled ? '위치 추적 중지' : '위치 추적 시작'}
        </CareButton>
      </CareEntrance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: '4%' },
  title: { color: CAREON_COLORS.title, fontSize: 24, fontWeight: '800', lineHeight: 29 },
  mapCard: { backgroundColor: CAREON_COLORS.background, borderRadius: 22, marginTop: 16, overflow: 'hidden', ...CAREON_SHADOW },
  mapArea: { height: 274 },
  map: { height: 274, width: '100%' },
  marker: { alignItems: 'center', backgroundColor: CAREON_COLORS.primaryDark, borderColor: CAREON_COLORS.background, borderRadius: 20, borderWidth: 3, height: 40, justifyContent: 'center', width: 40 },
  mapCaption: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 16 },
  locateButton: { alignItems: 'center', backgroundColor: CAREON_COLORS.background, borderRadius: 28, bottom: 16, elevation: 5, height: 56, justifyContent: 'center', position: 'absolute', right: 16, shadowColor: '#444444', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 7, width: 56 },
  locateButtonDisabled: { backgroundColor: '#EBEBEB', elevation: 0, shadowOpacity: 0 },
  captionIcon: { alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 16, height: 36, justifyContent: 'center', width: 36 },
  captionTextWrap: { flex: 1 },
  captionTitle: { color: CAREON_COLORS.title, fontSize: 14, fontWeight: '900' },
  captionText: { color: CAREON_COLORS.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  status: { backgroundColor: '#F6F6F6', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  statusActive: { backgroundColor: '#62E4BE' },
  statusText: { color: '#FF777B', fontSize: 11, fontWeight: '800' },
  statusTextActive: { color: CAREON_COLORS.primaryDark },
  infoCard: { backgroundColor: CAREON_COLORS.background, borderRadius: 22, marginTop: 16, overflow: 'hidden', ...CAREON_SHADOW },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 11, minHeight: 64, paddingHorizontal: 17 },
  infoLabel: { color: CAREON_COLORS.text, flex: 1, fontSize: 14, fontWeight: '800' },
  infoValue: { color: CAREON_COLORS.muted, fontSize: 13, fontWeight: '700' },
  divider: { backgroundColor: '#EBEBEB', height: 1 },
  trackingButton: { marginTop: 24 },
});
