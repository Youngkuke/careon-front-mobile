import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { ApiError } from '@/lib/api';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { SafeZoneEvent, useWear } from '@/lib/wear-state';

const responseLabel: Record<string, string> = {
  USER_OKAY: '워치에서 괜찮다고 응답했어요.',
  NEED_HELP: '워치에서 도움이 필요하다고 응답했어요.',
  NO_RESPONSE: '워치 응답 시간이 지났어요.',
};

export default function SafeZoneEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { getSafeZoneEvent, safeZoneEvent: activeEvent } = useWear();
  const [event, setEvent] = useState<SafeZoneEvent | null>(activeEvent?.id === Number(eventId) ? activeEvent : null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadEvent = useCallback(async () => {
    const id = Number(eventId);
    setLoading(true);
    setNotFound(false);
    setLoadFailed(false);
    if (!Number.isInteger(id) || id <= 0) {
      setEvent(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const result = await getSafeZoneEvent(id);
      setEvent(result);
      setNotFound(!result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNotFound(true);
      else setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [eventId, getSafeZoneEvent]);

  useEffect(() => { void loadEvent(); }, [loadEvent]);

  if (loading) return <Screen contentStyle={styles.empty}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="안심 구역 이탈" /><ActivityIndicator color={CAREON_COLORS.primaryDark} /></Screen>;
  if (!event) return <Screen contentStyle={styles.empty}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="안심 구역 이탈" /><Text style={styles.emptyText}>{notFound ? '요청한 안심 구역 이탈 정보를 찾을 수 없어요.' : loadFailed ? '이탈 정보를 불러오지 못했어요.' : '이탈 정보가 없어요.'}</Text>{loadFailed ? <CareButton onPress={() => void loadEvent()} style={styles.retry} variant="white">다시 시도</CareButton> : null}</Screen>;
  const openMap = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`);
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
    <Header onBack={() => replaceRoute('/wear')} style={styles.header} title="안심 구역 이탈" />
    <View style={styles.hero}><View style={styles.icon}><Ionicons color={CAREON_COLORS.danger} name="navigate" size={30} /></View><Text style={styles.title}>안심 구역 이탈이 감지됐어요</Text><Text style={styles.description}>{event.response ? responseLabel[event.response] ?? '응답 상태를 확인했어요.' : '워치의 응답을 기다리고 있어요.'}</Text></View>
    <View style={styles.card}><Info icon="time-outline" label="감지 시각" value={formatKoreanDateTime(event.detectedAt)} /><Info icon="location-outline" label="GPS 측정 시각" value={formatKoreanDateTime(event.capturedAt)} /><Info icon="navigate-outline" label="위치 정확도" value={`±${event.accuracyMeters}m`} /></View>
    <View style={styles.mapCard}><MapView initialRegion={{ latitude: event.latitude, longitude: event.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 }} scrollEnabled={false} style={styles.map} zoomEnabled={false}><Marker coordinate={{ latitude: event.latitude, longitude: event.longitude }} title="이탈 감지 위치" /></MapView></View>
    <CareButton onPress={openMap} variant="white">지도에서 보기</CareButton>
  </Screen>;
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) { return <View style={styles.info}><Ionicons color={CAREON_COLORS.primaryDark} name={icon} size={19} /><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
function formatKoreanDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(date); }
const styles = StyleSheet.create({ content:{padding:24,paddingTop:20},empty:{alignItems:'center',justifyContent:'center',paddingHorizontal:24,paddingTop:20},header:{marginHorizontal:-24},emptyText:{color:CAREON_COLORS.muted,fontSize:15,textAlign:'center'},retry:{marginTop:18},hero:{alignItems:'center',paddingVertical:26},icon:{alignItems:'center',backgroundColor:'#EBEBEB',borderRadius:32,height:64,justifyContent:'center',width:64},title:{color:CAREON_COLORS.title,fontSize:22,fontWeight:'900',marginTop:14,textAlign:'center'},description:{color:CAREON_COLORS.muted,fontSize:14,fontWeight:'600',marginTop:7,textAlign:'center'},card:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},info:{alignItems:'center',borderBottomColor:'#EBEBEB',borderBottomWidth:1,flexDirection:'row',gap:10,minHeight:59,paddingHorizontal:17},label:{color:CAREON_COLORS.text,fontSize:14,fontWeight:'800'},value:{color:CAREON_COLORS.muted,flex:1,fontSize:13,fontWeight:'700',textAlign:'right'},mapCard:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},map:{height:210,width:'100%'} });
