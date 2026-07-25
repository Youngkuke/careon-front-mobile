import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { useWear } from '@/lib/wear-state';

export default function EmergencyScreen() {
  const { acknowledgeEmergency, emergency } = useWear();
  const openMap = () => { if (emergency?.latitude != null && emergency.longitude != null) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`); };
  if (!emergency) return <Screen contentStyle={styles.empty}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="도움 요청" /><Text style={styles.emptyText}>확인할 도움 요청이 없어요.</Text></Screen>;
  const acknowledge = async () => { await acknowledgeEmergency(); replaceRoute('/wear'); };
  const requestedAt = formatKoreanDateTime(emergency.requestedAt);
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}><Header onBack={() => replaceRoute('/wear')} style={styles.header} title="도움 요청" />
    <View style={styles.hero}><View style={styles.alertIcon}><Ionicons color={CAREON_COLORS.danger} name="alert" size={32} /></View><Text style={styles.title}>{emergency.acknowledged ? '확인했어요' : '도움 요청이 왔어요'}</Text><Text style={styles.description}>연결된 워치에서 도움을 요청했어요.</Text></View>
    <View style={styles.card}><Info icon="time-outline" label="요청 시각" value={requestedAt} /><Info icon="heart-outline" label="마지막 심박수" value={emergency.heartRateBpm == null ? '정보 없음' : `${emergency.heartRateBpm} BPM`} />{emergency.accuracyMeters != null ? <Info icon="navigate-outline" label="위치 정확도" value={`±${emergency.accuracyMeters}m`} /> : null}</View>
    {emergency.latitude != null && emergency.longitude != null ? <View style={styles.mapCard}><MapView initialRegion={{ latitude: emergency.latitude, longitude: emergency.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 }} scrollEnabled={false} style={styles.map} zoomEnabled={false}><Marker coordinate={{ latitude: emergency.latitude, longitude: emergency.longitude }} title="도움 요청 위치" /></MapView><View style={styles.mapCaption}><Ionicons color={CAREON_COLORS.primaryDark} name="location" size={17} /><Text style={styles.mapCaptionText}>도움을 요청한 위치</Text></View></View> : null}
    {emergency.latitude != null ? <CareButton onPress={openMap} variant="white">지도에서 보기</CareButton> : null}
    {!emergency.acknowledged ? <CareButton onPress={acknowledge} style={styles.confirm}>확인했어요</CareButton> : null}
  </Screen>;
}
function Info({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}) { return <View style={styles.info}><Ionicons color={CAREON_COLORS.primaryDark} name={icon} size={19}/><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
function formatKoreanDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(date); }
const styles=StyleSheet.create({content:{padding:24,paddingTop:20},empty:{paddingHorizontal:24,paddingTop:20},header:{marginHorizontal:-24},emptyText:{color:CAREON_COLORS.muted,fontSize:15,textAlign:'center'},hero:{alignItems:'center',paddingVertical:26},alertIcon:{alignItems:'center',backgroundColor:'#FFF0F1',borderRadius:32,height:64,justifyContent:'center',width:64},title:{color:CAREON_COLORS.title,fontSize:23,fontWeight:'900',marginTop:14},description:{color:CAREON_COLORS.muted,fontSize:14,fontWeight:'600',marginTop:6},card:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},info:{alignItems:'center',borderBottomColor:'#F1F1F1',borderBottomWidth:1,flexDirection:'row',gap:10,minHeight:59,paddingHorizontal:17},label:{color:CAREON_COLORS.text,fontSize:14,fontWeight:'800'},value:{color:CAREON_COLORS.muted,flex:1,fontSize:13,fontWeight:'700',textAlign:'right'},mapCard:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},map:{height:190,width:'100%'},mapCaption:{alignItems:'center',flexDirection:'row',gap:6,paddingHorizontal:16,paddingVertical:12},mapCaptionText:{color:CAREON_COLORS.primaryDark,fontSize:13,fontWeight:'800'},confirm:{marginTop:12}});
