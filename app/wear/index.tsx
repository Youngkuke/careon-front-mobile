import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { pushRoute, replaceRoute } from '@/lib/navigation';
import { useWear } from '@/lib/wear-state';

export default function WearScreen() {
  const { connected, createPairingCode, emergency, pairingCode, safeZone, triggerDemoEmergency } = useWear();
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
    <Header onBack={() => replaceRoute('/mypage')} title="워치·안심 구역" />
    <Text style={styles.intro}>어머니의 워치 상태를 확인하고{`\n`}안심 구역을 관리할 수 있어요.</Text>
    <View style={styles.card}>
      <View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="watch-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>CareOn 워치</Text><Text style={styles.muted}>{connected ? '연결됨 · 마지막 확인 방금 전' : '연결 코드 입력 대기 중'}</Text></View><View style={[styles.badge, !connected && styles.pendingBadge]}><Text style={styles.badgeText}>{connected ? '연결됨' : '대기 중'}</Text></View></View>
      <View style={styles.codeBox}><Text style={styles.codeCaption}>워치 연결 코드</Text><Text style={styles.code}>{pairingCode}</Text><Text style={styles.muted}>워치에서 6자리 코드를 입력해주세요</Text></View>
      <CareButton onPress={createPairingCode} variant="white">새 연결 코드 만들기</CareButton>
    </View>
    <Pressable onPress={() => pushRoute('/wear/safe-zone')} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="shield-checkmark-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>안심 구역</Text><Text style={styles.muted}>{safeZone.enabled ? `${safeZone.name} · 반경 ${safeZone.radiusMeters}m` : '사용 안 함'}</Text></View><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={22} /></View></Pressable>
    {emergency && !emergency.acknowledged ? <CareButton onPress={() => pushRoute('/emergency/demo-sos-1')}>도움 요청 확인하기</CareButton> : null}
    <Pressable onPress={triggerDemoEmergency} style={styles.demo}><Text style={styles.demoText}>시연용: 위치 포함 도움 요청 띄우기</Text></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({ content:{ padding:24, paddingTop:20 }, intro:{ color:CAREON_COLORS.muted,fontSize:15,fontWeight:'600',lineHeight:22,marginBottom:22 }, card:{ backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:16,padding:18,...CAREON_SHADOW }, row:{alignItems:'center',flexDirection:'row',gap:12}, icon:{alignItems:'center',backgroundColor:'#E7F8F2',borderRadius:18,height:42,justifyContent:'center',width:42}, flex:{flex:1}, cardTitle:{color:CAREON_COLORS.title,fontSize:17,fontWeight:'900'}, muted:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'600',lineHeight:18}, badge:{backgroundColor:'#DDF8EF',borderRadius:12,paddingHorizontal:9,paddingVertical:5},pendingBadge:{backgroundColor:'#FFF0D9'},badgeText:{color:CAREON_COLORS.primaryDark,fontSize:11,fontWeight:'800'},codeBox:{alignItems:'center',backgroundColor:CAREON_COLORS.page,borderRadius:16,marginVertical:16,padding:14},codeCaption:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'700'},code:{color:CAREON_COLORS.primaryDark,fontSize:29,fontWeight:'900',letterSpacing:5,marginVertical:5},demo:{alignItems:'center',padding:12},demoText:{color:CAREON_COLORS.faint,fontSize:12,fontWeight:'700'} });
