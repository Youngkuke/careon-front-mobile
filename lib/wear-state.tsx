import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

export type SafeZone = { enabled: boolean; name: string; radiusMeters: number; latitude: number; longitude: number };
export type EmergencyEvent = { id: string; requestedAt: string; heartRateBpm: number; latitude?: number; longitude?: number; accuracyMeters?: number; locationLabel: string; acknowledged: boolean };
type WearContextValue = {
  pairingCode: string;
  connected: boolean;
  safeZone: SafeZone;
  emergency: EmergencyEvent | null;
  createPairingCode: () => void;
  saveSafeZone: (zone: SafeZone) => void;
  acknowledgeEmergency: () => void;
  triggerDemoEmergency: () => void;
};
const WearContext = createContext<WearContextValue | null>(null);

export function WearProvider({ children }: PropsWithChildren) {
  const [pairingCode, setPairingCode] = useState('111111');
  const [connected, setConnected] = useState(true);
  const [safeZone, setSafeZone] = useState<SafeZone>({ enabled: true, name: '집', radiusMeters: 150, latitude: 37.4965, longitude: 126.9572 });
  const [emergency, setEmergency] = useState<EmergencyEvent | null>(null);
  const value = useMemo(() => ({
    pairingCode,
    connected,
    safeZone,
    emergency,
    createPairingCode: () => { setPairingCode(String(Math.floor(100000 + Math.random() * 900000))); setConnected(false); },
    saveSafeZone: setSafeZone,
    acknowledgeEmergency: () => setEmergency((current) => current ? { ...current, acknowledged: true } : null),
    triggerDemoEmergency: () => setEmergency({ id: 'demo-sos-1', requestedAt: '방금 전', heartRateBpm: 124, latitude: 37.499, longitude: 126.9601, accuracyMeters: 18, locationLabel: '현재 위치', acknowledged: false }),
  }), [connected, emergency, pairingCode, safeZone]);
  return <WearContext.Provider value={value}>{children}</WearContext.Provider>;
}
export function useWear() { const value = useContext(WearContext); if (!value) throw new Error('WearProvider가 필요합니다.'); return value; }
