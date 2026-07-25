import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { useWear } from '@/lib/wear-state';

export default function EmergencyScreen() {
  const { acknowledgeEmergency, emergency } = useWear();
  const openMap = () => { if (emergency?.latitude != null && emergency.longitude != null) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`); };
  if (!emergency) return <Screen contentStyle={styles.empty}><Header onBack={() => replaceRoute('/wear')} title="도움 요청" /><Text style={styles.emptyText}>확인할 도움 요청이 없어요.</Text></Screen>;
  const acknowledge = () => { acknowledgeEmergency(); replaceRoute('/wear'); };
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}><Header onBack={() => replaceRoute('/wear')} title="도움 요청" />
    <View style={styles.hero}><View style={styles.alertIcon}><Ionicons color={CAREON_COLORS.danger} name="alert" size={32} /></View><Text style={styles.title}>{emergency.acknowledged ? '확인했어요' : '도움 요청이 왔어요'}</Text><Text style={styles.description}>어머니가 워치에서 도움을 요청했어요.</Text></View>
    <View style={styles.card}><Info icon="time-outline" label="요청 시각" value={emergency.requestedAt} /><Info icon="heart-outline" label="마지막 심박수" value={`${emergency.heartRateBpm} BPM`} /><Info icon="location-outline" label="위치" value={emergency.locationLabel} /><Info icon="navigate-outline" label="위치 정확도" value={`${emergency.accuracyMeters}m`} /></View>
    {emergency.latitude != null ? <CareButton onPress={openMap} variant="white">지도에서 보기</CareButton> : null}
    {!emergency.acknowledged ? <CareButton onPress={acknowledge} style={styles.confirm}>확인했어요</CareButton> : null}
  </Screen>;
}
function Info({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}) { return <View style={styles.info}><Ionicons color={CAREON_COLORS.primaryDark} name={icon} size={19}/><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
const styles=StyleSheet.create({content:{padding:24,paddingTop:20},empty:{paddingHorizontal:24,paddingTop:20},emptyText:{color:CAREON_COLORS.muted,fontSize:15,textAlign:'center'},hero:{alignItems:'center',paddingVertical:26},alertIcon:{alignItems:'center',backgroundColor:'#FFF0F1',borderRadius:32,height:64,justifyContent:'center',width:64},title:{color:CAREON_COLORS.title,fontSize:23,fontWeight:'900',marginTop:14},description:{color:CAREON_COLORS.muted,fontSize:14,fontWeight:'600',marginTop:6},card:{backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:18,overflow:'hidden',...CAREON_SHADOW},info:{alignItems:'center',borderBottomColor:'#F1F1F1',borderBottomWidth:1,flexDirection:'row',gap:10,minHeight:59,paddingHorizontal:17},label:{color:CAREON_COLORS.text,fontSize:14,fontWeight:'800'},value:{color:CAREON_COLORS.muted,flex:1,fontSize:13,fontWeight:'700',textAlign:'right'},confirm:{marginTop:12}});
