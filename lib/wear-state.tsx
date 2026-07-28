import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from './auth-state';

export type SafeZone = { id?: number; enabled: boolean; name: string; radiusMeters: 100 | 150 | 300 | 500; latitude: number; longitude: number };
export type EmergencyEvent = { id: number; requestedAt: string; heartRateBpm: number | null; latitude?: number; longitude?: number; accuracyMeters?: number; capturedAt?: string; locationLabel: string; acknowledged: boolean };
export type SafeZoneEvent = { id: number; detectedAt: string; capturedAt: string; latitude: number; longitude: number; accuracyMeters: number; response: string | null };
export type LiveLocation = { latitude: number; longitude: number; accuracyMeters: number | null; capturedAt: string };
export type WearDevice = { id: number; name: string; pairedAt: string | null; lastSeenAt: string | null };
export type LatestHeartRate = { bpm: number; measuredAt: string; source: string };
export type CareTimelineItem = { id: number; type: string; occurredAt: string; eventId: number | null; summary: string };
export type CursorPage<T> = { items: T[]; nextCursor: string | null };
export type CaredProfile = { id: number; relation: string; age: number; conditionSummary: string; severityLevel: string };
type WearContextValue = {
  pairingCode: string | null;
  pairingCodeExpiresAt: string | null;
  connected: boolean;
  wearDevice: WearDevice | null;
  cared: CaredProfile | null;
  isLoading: boolean;
  safeZone: SafeZone;
  emergency: EmergencyEvent | null;
  safeZoneEvent: SafeZoneEvent | null;
  liveLocation: LiveLocation | null;
  liveLocationTrackingEnabled: boolean;
  liveLocationTrackingExpiresAt: string | null;
  latestHeartRate: LatestHeartRate | null;
  createPairingCode: () => Promise<void>;
  setLiveLocationTracking: (enabled: boolean, expiresInMinutes?: number) => Promise<void>;
  disconnectWear: () => Promise<void>;
  saveSafeZone: (zone: SafeZone) => Promise<void>;
  acknowledgeEmergency: (eventId?: number) => Promise<void>;
  getEmergency: (eventId: number) => Promise<EmergencyEvent | null>;
  getSafeZoneEvent: (eventId: number) => Promise<SafeZoneEvent | null>;
  getEmergencyHistory: (cursor?: string | null, limit?: number) => Promise<CursorPage<EmergencyEvent>>;
  getSafeZoneHistory: (cursor?: string | null, limit?: number) => Promise<CursorPage<SafeZoneEvent>>;
  getCareTimeline: (cursor?: string | null) => Promise<CursorPage<CareTimelineItem>>;
  setTrackingScreenActive: (active: boolean) => void;
  refreshWearData: () => Promise<void>;
};
const WearContext = createContext<WearContextValue | null>(null);

const defaultSafeZone: SafeZone = { enabled: false, name: '집', radiusMeters: 150, latitude: 37.4965, longitude: 126.9572 };
type CaredDto = { cared_id: number; cared_relation: string; age: number; condition_summary: string; severity_level: string };
type SafeZoneDto = { safe_zone_id: number; name: string; latitude: number; longitude: number; radius_meters: 100 | 150 | 300 | 500; enabled: boolean };
type EmergencyDto = { event_id: number; heart_rate_bpm: number | null; status: 'PENDING' | 'ACKNOWLEDGED'; requested_at: string; location: { latitude: number; longitude: number; accuracy_meters?: number; captured_at: string; source: string } | null; location_status: string };
type SafeZoneEventDto = { event_id: number; response: string | null; detected_at: string; location: { latitude: number; longitude: number; accuracy_meters: number; captured_at: string } };
type LiveLocationDto = { latitude: number; longitude: number; accuracy_meters?: number | null; captured_at: string; is_tracking?: boolean; expires_at?: string | null; interval_seconds?: number };
type WearDeviceDto = { wear_device_id: number; connected: boolean; device_name?: string; last_seen_at?: string | null; paired_at?: string | null };
type LatestHeartRateDto = { bpm: number; measured_at: string; source: string };
type TimelineDto = { timeline_id: number; type: string; occurred_at: string; event_id: number | null; summary: string };
type CursorPageDto<T> = { items: T[]; next_cursor: string | null };
const toSafeZone = (dto: SafeZoneDto): SafeZone => ({ id: dto.safe_zone_id, enabled: dto.enabled, latitude: dto.latitude, longitude: dto.longitude, name: dto.name, radiusMeters: dto.radius_meters });
const toEmergency = (dto: EmergencyDto): EmergencyEvent => ({ id: dto.event_id, acknowledged: dto.status === 'ACKNOWLEDGED', accuracyMeters: dto.location?.accuracy_meters, capturedAt: dto.location?.captured_at, heartRateBpm: dto.heart_rate_bpm, latitude: dto.location?.latitude, locationLabel: dto.location_status === 'CURRENT' ? '현재 위치' : dto.location_status === 'LAST_KNOWN' ? '최근 위치' : '위치 정보 없음', longitude: dto.location?.longitude, requestedAt: dto.requested_at });
const toSafeZoneEvent = (dto: SafeZoneEventDto): SafeZoneEvent => ({ accuracyMeters: dto.location.accuracy_meters, capturedAt: dto.location.captured_at, detectedAt: dto.detected_at, id: dto.event_id, latitude: dto.location.latitude, longitude: dto.location.longitude, response: dto.response });
const toLiveLocation = (dto: LiveLocationDto): LiveLocation => ({ accuracyMeters: dto.accuracy_meters ?? null, capturedAt: dto.captured_at, latitude: dto.latitude, longitude: dto.longitude });
const toCared = (dto: CaredDto): CaredProfile => ({ age: dto.age, conditionSummary: dto.condition_summary, id: dto.cared_id, relation: dto.cared_relation, severityLevel: dto.severity_level });
const toWearDevice = (dto: WearDeviceDto): WearDevice => ({ id: dto.wear_device_id, name: dto.device_name ?? 'CareOn 워치', pairedAt: dto.paired_at ?? null, lastSeenAt: dto.last_seen_at ?? null });
const toLatestHeartRate = (dto: LatestHeartRateDto): LatestHeartRate => ({ bpm: dto.bpm, measuredAt: dto.measured_at, source: dto.source });
const toTimeline = (dto: TimelineDto): CareTimelineItem => ({ id: dto.timeline_id, type: dto.type, occurredAt: dto.occurred_at, eventId: dto.event_id, summary: dto.summary });

export function WearProvider({ children }: PropsWithChildren) {
  const { authenticatedRequest, status } = useAuth();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCodeExpiresAt, setPairingCodeExpiresAt] = useState<string | null>(null);
  const [safeZone, setSafeZone] = useState<SafeZone>(defaultSafeZone);
  const [emergency, setEmergency] = useState<EmergencyEvent | null>(null);
  const [safeZoneEvent, setSafeZoneEvent] = useState<SafeZoneEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cared, setCared] = useState<CaredProfile | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [liveLocationTrackingEnabled, setLiveLocationTrackingEnabled] = useState(false);
  const [liveLocationTrackingExpiresAt, setLiveLocationTrackingExpiresAt] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [wearDevice, setWearDevice] = useState<WearDevice | null>(null);
  const [latestHeartRate, setLatestHeartRate] = useState<LatestHeartRate | null>(null);
  const [trackingScreenActive, setTrackingScreenActive] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const refreshWearData = useCallback(async (includeLiveLocation = false) => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const [caredDtos, wearDevice] = await Promise.all([
        authenticatedRequest<CaredDto[]>('/api/app/users/me/cared'),
        authenticatedRequest<WearDeviceDto | null>('/api/app/wear-device'),
      ]);
      const isConnected = wearDevice?.connected ?? false;
      setConnected(isConnected);
      setWearDevice(isConnected && wearDevice ? toWearDevice(wearDevice) : null);
      if (isConnected) { setPairingCode(null); setPairingCodeExpiresAt(null); }
      const profiles = caredDtos.map(toCared);
      const selectedCared = profiles.find((profile) => profile.id === cared?.id) ?? profiles[0] ?? null;
      setCared(selectedCared);
      if (!selectedCared) { setSafeZone(defaultSafeZone); setEmergency(null); setSafeZoneEvent(null); setLiveLocation(null); setLatestHeartRate(null); return; }
      const [zone, activeEmergency, activeExit, latestLiveLocation, latestHeart] = await Promise.all([
        authenticatedRequest<SafeZoneDto | null>(`/api/app/cared/${selectedCared.id}/safe-zone`),
        authenticatedRequest<EmergencyDto | null>(`/api/app/cared/${selectedCared.id}/emergency-events/active`),
        authenticatedRequest<SafeZoneEventDto | null>(`/api/app/cared/${selectedCared.id}/safe-zone-events/active`),
        includeLiveLocation ? authenticatedRequest<LiveLocationDto | null>('/api/app/wear/live-location') : Promise.resolve(null),
        authenticatedRequest<LatestHeartRateDto | null>(`/api/app/cared/${selectedCared.id}/heart-rates/latest`),
      ]);
      setSafeZone(zone ? toSafeZone(zone) : defaultSafeZone);
      setEmergency(activeEmergency ? toEmergency(activeEmergency) : null);
      setSafeZoneEvent(activeExit ? toSafeZoneEvent(activeExit) : null);
      setLatestHeartRate(latestHeart ? toLatestHeartRate(latestHeart) : null);
      if (includeLiveLocation) setLiveLocation(latestLiveLocation ? toLiveLocation(latestLiveLocation) : null);
      if (typeof latestLiveLocation?.is_tracking === 'boolean') setLiveLocationTrackingEnabled(latestLiveLocation.is_tracking);
      if (includeLiveLocation) setLiveLocationTrackingExpiresAt(latestLiveLocation?.expires_at ?? null);
    } finally { setIsLoading(false); }
  }, [authenticatedRequest, cared?.id, status]);

  const refreshLiveLocation = useCallback(async () => {
    if (status !== 'authenticated') return;
    const dto = await authenticatedRequest<LiveLocationDto | null>('/api/app/wear/live-location');
    setLiveLocation(dto ? toLiveLocation(dto) : null);
    if (typeof dto?.is_tracking === 'boolean') setLiveLocationTrackingEnabled(dto.is_tracking);
    setLiveLocationTrackingExpiresAt(dto?.expires_at ?? null);
  }, [authenticatedRequest, status]);

  useEffect(() => { void refreshWearData(true); }, [refreshWearData]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => setAppState(nextState));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (status !== 'authenticated' || appState !== 'active') return;
    void refreshWearData(trackingScreenActive);
    // Emergency and safe-zone events have push delivery; this is only a conservative fallback.
    const timer = setInterval(() => { void refreshWearData(false); }, 15_000);
    return () => clearInterval(timer);
  }, [appState, refreshWearData, status, trackingScreenActive]);
  useEffect(() => {
    if (status !== 'authenticated' || appState !== 'active' || !trackingScreenActive) return;
    void refreshLiveLocation();
    const timer = setInterval(() => { void refreshLiveLocation(); }, 3_000);
    return () => clearInterval(timer);
  }, [appState, refreshLiveLocation, status, trackingScreenActive]);

  const createPairingCode = useCallback(async () => {
    const result = await authenticatedRequest<{ code: string; expires_at: string }>('/api/app/wear-pairing-codes', { method: 'POST' });
    setPairingCode(result.code); setPairingCodeExpiresAt(result.expires_at);
    await refreshWearData(true);
  }, [authenticatedRequest, refreshWearData]);
  const setLiveLocationTracking = useCallback(async (enabled: boolean, expiresInMinutes = 60) => {
    const response = await authenticatedRequest<{ enabled?: boolean; expires_at?: string | null }>('/api/app/wear/live-location/tracking', { body: enabled ? { enabled, expires_in_minutes: expiresInMinutes } : { enabled }, method: 'PATCH' });
    setLiveLocationTrackingEnabled(response.enabled ?? enabled);
    setLiveLocationTrackingExpiresAt(response.expires_at ?? null);
    if (enabled) await refreshLiveLocation(); else setLiveLocation(null);
  }, [authenticatedRequest, refreshLiveLocation]);
  const disconnectWear = useCallback(async () => {
    await authenticatedRequest('/api/app/wear-device', { method: 'DELETE' });
    setConnected(false); setWearDevice(null); setLiveLocation(null); setLiveLocationTrackingEnabled(false); setLiveLocationTrackingExpiresAt(null);
  }, [authenticatedRequest]);
  const saveSafeZone = useCallback(async (zone: SafeZone) => {
    if (!cared) throw new Error('등록된 돌봄 대상자가 없어요.');
    const dto = await authenticatedRequest<SafeZoneDto>(`/api/app/cared/${cared.id}/safe-zone`, { body: { enabled: zone.enabled, latitude: zone.latitude, longitude: zone.longitude, name: zone.name, radius_meters: zone.radiusMeters }, method: 'PUT' });
    setSafeZone(toSafeZone(dto));
  }, [authenticatedRequest, cared]);
  const getEmergency = useCallback(async (eventId: number) => {
    const dto = await authenticatedRequest<EmergencyDto | null>(`/api/app/emergency-events/${eventId}`);
    return dto ? toEmergency(dto) : null;
  }, [authenticatedRequest]);
  const getSafeZoneEvent = useCallback(async (eventId: number) => {
    const dto = await authenticatedRequest<SafeZoneEventDto | null>(`/api/app/safe-zone-events/${eventId}`);
    return dto ? toSafeZoneEvent(dto) : null;
  }, [authenticatedRequest]);
  const acknowledgeEmergency = useCallback(async (eventId?: number) => {
    const targetId = eventId ?? emergency?.id;
    if (!targetId) return;
    await authenticatedRequest(`/api/app/emergency-events/${targetId}/acknowledge`, { method: 'PATCH' });
    setEmergency((current) => current?.id === targetId ? { ...current, acknowledged: true } : current);
  }, [authenticatedRequest, emergency?.id]);
  const getEmergencyHistory = useCallback(async (cursor?: string | null, limit = 20) => {
    if (!cared) return { items: [], nextCursor: null };
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=${limit}` : `?limit=${limit}`;
    const page = await authenticatedRequest<CursorPageDto<EmergencyDto>>(`/api/app/cared/${cared.id}/emergency-events${query}`);
    return { items: page.items.map(toEmergency), nextCursor: page.next_cursor };
  }, [authenticatedRequest, cared]);
  const getSafeZoneHistory = useCallback(async (cursor?: string | null, limit = 20) => {
    if (!cared) return { items: [], nextCursor: null };
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=${limit}` : `?limit=${limit}`;
    const page = await authenticatedRequest<CursorPageDto<SafeZoneEventDto>>(`/api/app/cared/${cared.id}/safe-zone-events${query}`);
    return { items: page.items.map(toSafeZoneEvent), nextCursor: page.next_cursor };
  }, [authenticatedRequest, cared]);
  const getCareTimeline = useCallback(async (cursor?: string | null) => {
    if (!cared) return { items: [], nextCursor: null };
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=20` : '?limit=20';
    const page = await authenticatedRequest<CursorPageDto<TimelineDto>>(`/api/app/cared/${cared.id}/care-timeline${query}`);
    return { items: page.items.map(toTimeline), nextCursor: page.next_cursor };
  }, [authenticatedRequest, cared]);
  const value = useMemo(() => ({ pairingCode, pairingCodeExpiresAt, connected, wearDevice, cared, isLoading, safeZone, emergency, safeZoneEvent, liveLocation, liveLocationTrackingEnabled, liveLocationTrackingExpiresAt, latestHeartRate, createPairingCode, setLiveLocationTracking, disconnectWear, saveSafeZone, acknowledgeEmergency, getEmergency, getSafeZoneEvent, getEmergencyHistory, getSafeZoneHistory, getCareTimeline, refreshWearData: () => refreshWearData(true), setTrackingScreenActive }), [acknowledgeEmergency, cared, connected, createPairingCode, disconnectWear, emergency, getCareTimeline, getEmergency, getEmergencyHistory, getSafeZoneEvent, getSafeZoneHistory, isLoading, latestHeartRate, liveLocation, liveLocationTrackingEnabled, liveLocationTrackingExpiresAt, pairingCode, pairingCodeExpiresAt, refreshWearData, safeZone, safeZoneEvent, saveSafeZone, setLiveLocationTracking, wearDevice]);
  return <WearContext.Provider value={value}>{children}</WearContext.Provider>;
}
export function useWear() { const value = useContext(WearContext); if (!value) throw new Error('WearProvider가 필요합니다.'); return value; }
