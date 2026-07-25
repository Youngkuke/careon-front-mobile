import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { pushRoute, replaceRoute } from '@/lib/navigation';
import { useWear } from '@/lib/wear-state';

export default function WearScreen() {
  const { cared, connected, createPairingCode, emergency, pairingCode, pairingCodeExpiresAt, safeZone, safeZoneEvent } = useWear();
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const handleCreatePairingCode = async () => {
    setIsCreatingCode(true);
    try {
      await createPairingCode();
    } catch (error) {
      Alert.alert('연결 코드 발급 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setIsCreatingCode(false);
    }
  };
  const expiresAt = pairingCodeExpiresAt
    ? new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(pairingCodeExpiresAt))
    : '';
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
    <Header onBack={() => replaceRoute('/mypage')} style={styles.header} title="워치·안심 구역" />
    <View style={styles.card}>
      <View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="watch-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>CareOn 워치</Text><Text style={styles.muted}>{connected ? '워치가 연결되어 있어요' : pairingCode ? '연결 코드가 발급됐어요' : '연결 코드를 발급해주세요'}</Text></View><View style={[styles.badge, !connected && !pairingCode && styles.pendingBadge]}><Text style={styles.badgeText}>{connected ? '연결됨' : pairingCode ? '코드 발급됨' : '대기 중'}</Text></View></View>
      <View style={styles.codeBox}><Text style={styles.codeCaption}>워치 연결 코드</Text><Text style={styles.code}>{pairingCode ?? '------'}</Text><Text style={styles.muted}>{pairingCode ? `만료 ${expiresAt}` : '새 연결 코드를 만들어주세요'}</Text></View>
      <CareButton disabled={isCreatingCode} onPress={() => void handleCreatePairingCode()} variant="white">{isCreatingCode ? '코드 만드는 중' : '새 연결 코드 만들기'}</CareButton>
    </View>
    {cared ? <><Pressable onPress={() => pushRoute('/wear/safe-zone')} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="shield-checkmark-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>안심 구역</Text><Text style={styles.muted}>{safeZone.enabled ? `${safeZone.name} · 반경 ${safeZone.radiusMeters}m` : '사용 안 함'}</Text></View><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={22} /></View></Pressable>
    {emergency && !emergency.acknowledged ? <CareButton onPress={() => pushRoute(`/emergency/${emergency.id}`)}>도움 요청 확인하기</CareButton> : null}
    {safeZoneEvent ? <View style={styles.exitNotice}><Ionicons color={CAREON_COLORS.danger} name="navigate-outline" size={18} /><Text style={styles.exitText}>안심 구역 이탈이 감지됐어요.</Text></View> : null}</> : null}
  </Screen>;
}
const styles = StyleSheet.create({ content:{ padding:24, paddingTop:20 }, header:{marginHorizontal:-24}, card:{ backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:16,padding:18,...CAREON_SHADOW }, row:{alignItems:'center',flexDirection:'row',gap:12}, icon:{alignItems:'center',backgroundColor:'#E7F8F2',borderRadius:18,height:42,justifyContent:'center',width:42}, flex:{flex:1}, cardTitle:{color:CAREON_COLORS.title,fontSize:17,fontWeight:'900'}, muted:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'600',lineHeight:18}, badge:{backgroundColor:'#DDF8EF',borderRadius:12,paddingHorizontal:9,paddingVertical:5},pendingBadge:{backgroundColor:'#FFF0D9'},badgeText:{color:CAREON_COLORS.primaryDark,fontSize:11,fontWeight:'800'},codeBox:{alignItems:'center',backgroundColor:CAREON_COLORS.page,borderRadius:16,marginVertical:16,padding:14},codeCaption:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'700'},code:{color:CAREON_COLORS.primaryDark,fontSize:29,fontWeight:'900',letterSpacing:5,marginVertical:5},exitNotice:{alignItems:'center',flexDirection:'row',gap:7,justifyContent:'center',padding:12},exitText:{color:CAREON_COLORS.danger,fontSize:13,fontWeight:'800'} });
