import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './auth-state';

export type SafeZone = { id?: number; enabled: boolean; name: string; radiusMeters: 100 | 150 | 300 | 500; latitude: number; longitude: number };
export type EmergencyEvent = { id: number; requestedAt: string; heartRateBpm: number | null; latitude?: number; longitude?: number; accuracyMeters?: number; capturedAt?: string; locationLabel: string; acknowledged: boolean };
export type SafeZoneEvent = { id: number; detectedAt: string; capturedAt: string; latitude: number; longitude: number; accuracyMeters: number; response: string | null };
export type LiveLocation = { latitude: number; longitude: number; accuracyMeters: number | null; capturedAt: string };
export type CaredProfile = { id: number; relation: string; age: number; conditionSummary: string; severityLevel: string };
type WearContextValue = {
  pairingCode: string | null;
  pairingCodeExpiresAt: string | null;
  connected: boolean;
  cared: CaredProfile | null;
  isLoading: boolean;
  safeZone: SafeZone;
  emergency: EmergencyEvent | null;
  safeZoneEvent: SafeZoneEvent | null;
  liveLocation: LiveLocation | null;
  liveLocationTrackingEnabled: boolean;
  createPairingCode: () => Promise<void>;
  setLiveLocationTracking: (enabled: boolean) => Promise<void>;
  saveSafeZone: (zone: SafeZone) => Promise<void>;
  acknowledgeEmergency: (eventId?: number) => Promise<void>;
  getEmergency: (eventId: number) => Promise<EmergencyEvent | null>;
  getSafeZoneEvent: (eventId: number) => Promise<SafeZoneEvent | null>;
  refreshWearData: () => Promise<void>;
};
const WearContext = createContext<WearContextValue | null>(null);

const defaultSafeZone: SafeZone = { enabled: false, name: '집', radiusMeters: 150, latitude: 37.4965, longitude: 126.9572 };
type CaredDto = { cared_id: number; cared_relation: string; age: number; condition_summary: string; severity_level: string };
type SafeZoneDto = { safe_zone_id: number; name: string; latitude: number; longitude: number; radius_meters: 100 | 150 | 300 | 500; enabled: boolean };
type EmergencyDto = { event_id: number; heart_rate_bpm: number | null; status: 'PENDING' | 'ACKNOWLEDGED'; requested_at: string; location: { latitude: number; longitude: number; accuracy_meters?: number; captured_at: string; source: string } | null; location_status: string };
type SafeZoneEventDto = { event_id: number; response: string | null; detected_at: string; location: { latitude: number; longitude: number; accuracy_meters: number; captured_at: string } };
type LiveLocationDto = { latitude: number; longitude: number; accuracy_meters?: number | null; captured_at: string; tracking_enabled?: boolean };
type WearDeviceDto = { wear_device_id?: number; connected?: boolean; is_connected?: boolean };
const toSafeZone = (dto: SafeZoneDto): SafeZone => ({ id: dto.safe_zone_id, enabled: dto.enabled, latitude: dto.latitude, longitude: dto.longitude, name: dto.name, radiusMeters: dto.radius_meters });
const toEmergency = (dto: EmergencyDto): EmergencyEvent => ({ id: dto.event_id, acknowledged: dto.status === 'ACKNOWLEDGED', accuracyMeters: dto.location?.accuracy_meters, capturedAt: dto.location?.captured_at, heartRateBpm: dto.heart_rate_bpm, latitude: dto.location?.latitude, locationLabel: dto.location_status === 'CURRENT' ? '현재 위치' : dto.location_status === 'LAST_KNOWN' ? '최근 위치' : '위치 정보 없음', longitude: dto.location?.longitude, requestedAt: dto.requested_at });
const toSafeZoneEvent = (dto: SafeZoneEventDto): SafeZoneEvent => ({ accuracyMeters: dto.location.accuracy_meters, capturedAt: dto.location.captured_at, detectedAt: dto.detected_at, id: dto.event_id, latitude: dto.location.latitude, longitude: dto.location.longitude, response: dto.response });
const toLiveLocation = (dto: LiveLocationDto): LiveLocation => ({ accuracyMeters: dto.accuracy_meters ?? null, capturedAt: dto.captured_at, latitude: dto.latitude, longitude: dto.longitude });
const toCared = (dto: CaredDto): CaredProfile => ({ age: dto.age, conditionSummary: dto.condition_summary, id: dto.cared_id, relation: dto.cared_relation, severityLevel: dto.severity_level });

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
  const [connected, setConnected] = useState(false);

  const refreshWearData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const [caredDtos, wearDevice] = await Promise.all([
        authenticatedRequest<CaredDto[]>('/api/app/users/me/cared'),
        authenticatedRequest<WearDeviceDto | null>('/api/app/wear-device'),
      ]);
      setConnected(wearDevice?.connected ?? wearDevice?.is_connected ?? Boolean(wearDevice?.wear_device_id));
      const profiles = caredDtos.map(toCared);
      const selectedCared = profiles.find((profile) => profile.id === cared?.id) ?? profiles[0] ?? null;
      setCared(selectedCared);
      if (!selectedCared) { setSafeZone(defaultSafeZone); setEmergency(null); setSafeZoneEvent(null); setLiveLocation(null); return; }
      const [zone, activeEmergency, activeExit, latestLiveLocation] = await Promise.all([
        authenticatedRequest<SafeZoneDto | null>(`/api/app/cared/${selectedCared.id}/safe-zone`),
        authenticatedRequest<EmergencyDto | null>(`/api/app/cared/${selectedCared.id}/emergency-events/active`),
        authenticatedRequest<SafeZoneEventDto | null>(`/api/app/cared/${selectedCared.id}/safe-zone-events/active`),
        authenticatedRequest<LiveLocationDto | null>('/api/app/wear/live-location'),
      ]);
      setSafeZone(zone ? toSafeZone(zone) : defaultSafeZone);
      setEmergency(activeEmergency ? toEmergency(activeEmergency) : null);
      setSafeZoneEvent(activeExit ? toSafeZoneEvent(activeExit) : null);
      setLiveLocation(latestLiveLocation ? toLiveLocation(latestLiveLocation) : null);
      if (typeof latestLiveLocation?.tracking_enabled === 'boolean') setLiveLocationTrackingEnabled(latestLiveLocation.tracking_enabled);
    } finally { setIsLoading(false); }
  }, [authenticatedRequest, cared?.id, status]);

  useEffect(() => { void refreshWearData(); }, [refreshWearData]);
  useEffect(() => {
    if (status !== 'authenticated') return;
    const timer = setInterval(() => { void refreshWearData(); }, 3_000);
    return () => clearInterval(timer);
  }, [refreshWearData, status]);

  const createPairingCode = useCallback(async () => {
    const result = await authenticatedRequest<{ code: string; expires_at: string }>('/api/app/wear-pairing-codes', { method: 'POST' });
    setPairingCode(result.code); setPairingCodeExpiresAt(result.expires_at);
    await refreshWearData();
  }, [authenticatedRequest, refreshWearData]);
  const setLiveLocationTracking = useCallback(async (enabled: boolean) => {
    const response = await authenticatedRequest<{ enabled?: boolean }>('/api/app/wear/live-location/tracking', { body: { enabled }, method: 'PATCH' });
    setLiveLocationTrackingEnabled(response.enabled ?? enabled);
    if (enabled) await refreshWearData(); else setLiveLocation(null);
  }, [authenticatedRequest, refreshWearData]);
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
  const value = useMemo(() => ({ pairingCode, pairingCodeExpiresAt, connected, cared, isLoading, safeZone, emergency, safeZoneEvent, liveLocation, liveLocationTrackingEnabled, createPairingCode, setLiveLocationTracking, saveSafeZone, acknowledgeEmergency, getEmergency, getSafeZoneEvent, refreshWearData }), [acknowledgeEmergency, cared, connected, createPairingCode, emergency, getEmergency, getSafeZoneEvent, isLoading, liveLocation, liveLocationTrackingEnabled, pairingCode, pairingCodeExpiresAt, refreshWearData, safeZone, safeZoneEvent, saveSafeZone, setLiveLocationTracking]);
  return <WearContext.Provider value={value}>{children}</WearContext.Provider>;
}
export function useWear() { const value = useContext(WearContext); if (!value) throw new Error('WearProvider가 필요합니다.'); return value; }
