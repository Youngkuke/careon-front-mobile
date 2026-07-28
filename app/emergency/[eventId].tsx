import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { ApiError } from '@/lib/api';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { useWear } from '@/lib/wear-state';

export default function EmergencyScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { acknowledgeEmergency, emergency: activeEmergency, getEmergency } = useWear();
  const [emergency, setEmergency] = useState(activeEmergency?.id === Number(eventId) ? activeEmergency : null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [acknowledgeError, setAcknowledgeError] = useState<string | null>(null);

  const loadEmergency = useCallback(async () => {
    const id = Number(eventId);
    setIsLoading(true);
    setLoadFailed(false);
    setNotFound(false);
    if (!Number.isInteger(id) || id <= 0) {
      setEmergency(null);
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    try {
      const event = await getEmergency(id);
      setEmergency(event);
      setNotFound(!event);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setNotFound(true);
      else setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, getEmergency]);

  useEffect(() => { void loadEmergency(); }, [loadEmergency]);

  const openMap = () => { if (emergency?.latitude != null && emergency.longitude != null) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`); };
  if (isLoading) return <Screen contentStyle={styles.empty}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="도움 요청" /><ActivityIndicator color={CAREON_COLORS.primaryDark} /></Screen>;
  if (!emergency) return <Screen contentStyle={styles.empty}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="도움 요청" /><Text style={styles.emptyText}>{notFound ? '요청한 도움 요청을 찾을 수 없어요.' : loadFailed ? '도움 요청 정보를 불러오지 못했어요.' : '확인할 도움 요청이 없어요.'}</Text>{loadFailed ? <CareButton onPress={() => void loadEmergency()} style={styles.retry} variant="white">다시 시도</CareButton> : null}</Screen>;
  const acknowledge = async () => {
    setIsAcknowledging(true);
    setAcknowledgeError(null);
    try {
      await acknowledgeEmergency(emergency.id);
      setEmergency((current) => current ? { ...current, acknowledged: true } : current);
      replaceRoute('/wear');
    } catch (error) {
      setAcknowledgeError(error instanceof Error ? error.message : '확인 처리에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setIsAcknowledging(false);
    }
  };
  const requestedAt = formatKoreanDateTime(emergency.requestedAt);
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="도움 요청" />
    <View style={styles.hero}><View style={styles.alertIcon}><Ionicons color={CAREON_COLORS.danger} name="alert" size={32} /></View><Text style={styles.title}>{emergency.acknowledged ? '확인했어요' : '도움 요청이 왔어요'}</Text><Text style={styles.description}>연결된 워치에서 도움을 요청했어요.</Text></View>
    <View style={styles.card}><Info icon="time-outline" label="요청 시각" value={requestedAt} /><Info icon="heart-outline" label="마지막 심박수" value={emergency.heartRateBpm == null ? '정보 없음' : `${emergency.heartRateBpm} BPM`} />{emergency.accuracyMeters != null ? <Info icon="navigate-outline" label="위치 정확도" value={`±${emergency.accuracyMeters}m`} /> : null}</View>
    {emergency.latitude != null && emergency.longitude != null ? <View style={styles.mapCard}><MapView initialRegion={{ latitude: emergency.latitude, longitude: emergency.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 }} scrollEnabled={false} style={styles.map} zoomEnabled={false}><Marker coordinate={{ latitude: emergency.latitude, longitude: emergency.longitude }} title="도움 요청 위치" /></MapView><View style={styles.mapCaption}><Ionicons color={CAREON_COLORS.primaryDark} name="location" size={17} /><Text style={styles.mapCaptionText}>도움을 요청한 위치</Text></View></View> : null}
    {emergency.latitude != null ? <CareButton onPress={openMap} variant="white">지도에서 보기</CareButton> : null}
    {acknowledgeError ? <Text style={styles.actionError}>{acknowledgeError}</Text> : null}
    {!emergency.acknowledged ? <CareButton disabled={isAcknowledging} onPress={() => void acknowledge()} style={styles.confirm}>{isAcknowledging ? '확인 처리 중...' : acknowledgeError ? '다시 확인하기' : '확인했어요'}</CareButton> : null}
  </Screen>;
}
function Info({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}) { return <View style={styles.info}><Ionicons color={CAREON_COLORS.primaryDark} name={icon} size={19}/><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
function formatKoreanDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(date); }
const styles=StyleSheet.create({content:{padding:24,paddingTop:20},empty:{paddingHorizontal:24,paddingTop:20},header:{marginHorizontal:-24},emptyText:{color:CAREON_COLORS.muted,fontSize:15,textAlign:'center'},retry:{marginTop:18},hero:{alignItems:'center',paddingVertical:26},alertIcon:{alignItems:'center',backgroundColor:'#EBEBEB',borderRadius:32,height:64,justifyContent:'center',width:64},title:{color:CAREON_COLORS.title,fontSize:23,fontWeight:'900',marginTop:14},description:{color:CAREON_COLORS.muted,fontSize:14,fontWeight:'600',marginTop:6},card:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},info:{alignItems:'center',borderBottomColor:'#EBEBEB',borderBottomWidth:1,flexDirection:'row',gap:10,minHeight:59,paddingHorizontal:17},label:{color:CAREON_COLORS.text,fontSize:14,fontWeight:'800'},value:{color:CAREON_COLORS.muted,flex:1,fontSize:13,fontWeight:'700',textAlign:'right'},mapCard:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},map:{height:190,width:'100%'},mapCaption:{alignItems:'center',flexDirection:'row',gap:6,paddingHorizontal:16,paddingVertical:12},mapCaptionText:{color:CAREON_COLORS.primaryDark,fontSize:13,fontWeight:'800'},actionError:{color:CAREON_COLORS.danger,fontSize:13,fontWeight:'700',lineHeight:19,textAlign:'center'},confirm:{marginTop:12}});
