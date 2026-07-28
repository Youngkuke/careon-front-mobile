import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { CareButton, Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { pushRoute, replaceRoute } from '@/lib/navigation';
import { useWear } from '@/lib/wear-state';

export default function WearScreen() {
  const { cared, connected, createPairingCode, disconnectWear, emergency, latestHeartRate, pairingCode, pairingCodeExpiresAt, safeZone, safeZoneEvent, wearDevice } = useWear();
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!pairingCodeExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [pairingCodeExpiresAt]);
  const createCode = async () => {
    setIsCreatingCode(true);
    try {
      await createPairingCode();
    } catch (error) {
      Alert.alert('연결 코드 발급 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setIsCreatingCode(false);
    }
  };
  const remainingSeconds = pairingCodeExpiresAt ? Math.max(0, Math.ceil((new Date(pairingCodeExpiresAt).getTime() - now) / 1_000)) : null;
  const expiresAt = remainingSeconds != null
    ? remainingSeconds > 0 ? `${Math.floor(remainingSeconds / 60)}분 ${String(remainingSeconds % 60).padStart(2, '0')}초 남음` : '코드가 만료됐어요'
    : '';
  const handleCreatePairingCode = () => void createCode();
  const handleDisconnect = () => Alert.alert('워치 연결 해제', '이 워치에서는 서버 요청이 즉시 차단됩니다. 다시 사용하려면 새 연결 코드가 필요해요.', [
    { text: '취소', style: 'cancel' },
    { text: '연결 해제', style: 'destructive', onPress: () => void disconnectWear().catch((error) => Alert.alert('연결 해제 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')) },
  ]);
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
    <Header onBack={() => replaceRoute('/mypage')} style={styles.header} title="워치·안심 구역" />
    <View style={styles.card}>
      <View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="watch-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{wearDevice?.name ?? 'CareOn 워치'}</Text></View><View style={[styles.badge, connected && styles.connectedBadge]}><Text style={[styles.badgeText, connected && styles.connectedBadgeText]}>{connected ? '연결됨' : pairingCode ? '코드 발급됨' : '대기 중'}</Text></View></View>
      <View style={[styles.codeBox, isCreatingCode && styles.codeBoxLoading]}>{isCreatingCode ? <View style={styles.codeLoading}><ActivityIndicator color={CAREON_COLORS.primaryDark} size="large" /><Text style={styles.codeLoadingText}>코드 생성중</Text></View> : <><Text style={styles.codeCaption}>워치 연결 코드</Text><Text style={styles.code}>{pairingCode ?? '------'}</Text>{pairingCode ? <Text style={styles.muted}>만료 {expiresAt}</Text> : null}</>}</View>
      <View style={styles.connectionActions}>
        <CareButton disabled={connected || isCreatingCode} onPress={handleCreatePairingCode} style={styles.connectionAction} variant="white">연결</CareButton>
        <CareButton disabled={!connected} onPress={handleDisconnect} style={styles.connectionAction} variant="dangerText">연결 해제</CareButton>
      </View>
    </View>
    {cared ? <><Pressable onPress={() => pushRoute('/wear/safe-zone')} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="shield-checkmark-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>안심 구역</Text><Text style={styles.muted}>{safeZone.enabled ? `${safeZone.name} · 반경 ${safeZone.radiusMeters}m` : '사용 안 함'}</Text></View><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={22} /></View></Pressable>
    <View style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="heart-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>최근 심박수</Text>{latestHeartRate ? <Text style={styles.muted}>{formatHeartMeasuredAt(latestHeartRate.measuredAt)} 측정 · 워치 센서</Text> : null}</View><Text style={styles.heartValue}>{latestHeartRate ? `${latestHeartRate.bpm} BPM` : '—'}</Text></View></View>
    {safeZoneEvent ? <Pressable onPress={() => pushRoute(`/safe-zone-events/${safeZoneEvent.id}`)} style={styles.exitNotice}><Ionicons color={CAREON_COLORS.danger} name="navigate-outline" size={18} /><Text style={styles.exitText}>안심 구역 이탈이 감지됐어요. 자세히 보기</Text></Pressable> : null}</> : null}
    {cared ? <Pressable onPress={() => pushRoute('/wear/history')} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons color={CAREON_COLORS.primaryDark} name="time-outline" size={22} /></View><View style={styles.flex}><Text style={styles.cardTitle}>돌봄 이력</Text></View><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={22} /></View></Pressable> : null}
    {emergency && !emergency.acknowledged ? <CareButton onPress={() => pushRoute(`/emergency/${emergency.id}`)} variant="danger">도움 요청 확인하기</CareButton> : null}
  </Screen>;
}
function formatHeartMeasuredAt(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '최근' : new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(date); }
const styles = StyleSheet.create({ content:{ padding:24, paddingTop:20 }, header:{marginBottom:14,marginHorizontal:-24}, card:{ backgroundColor:CAREON_COLORS.background,borderRadius:22,marginBottom:20,padding:18,...CAREON_SHADOW }, row:{alignItems:'center',flexDirection:'row',gap:12}, icon:{alignItems:'center',backgroundColor:'#EBEBEB',borderRadius:18,height:42,justifyContent:'center',width:42}, flex:{flex:1}, cardTitle:{color:CAREON_COLORS.title,fontSize:17,fontWeight:'900'}, muted:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'600',lineHeight:18},heartValue:{color:CAREON_COLORS.primaryDark,fontSize:14,fontWeight:'900'}, badge:{backgroundColor:'#F6F6F6',borderRadius:12,paddingHorizontal:9,paddingVertical:5},connectedBadge:{backgroundColor:'#62E4BE'},badgeText:{color:'#FF777B',fontSize:11,fontWeight:'800'},connectedBadgeText:{color:CAREON_COLORS.primaryDark},codeBox:{alignItems:'center',backgroundColor:CAREON_COLORS.page,borderRadius:16,marginVertical:18,padding:14},codeBoxLoading:{justifyContent:'center',minHeight:98},codeCaption:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'700'},code:{color:CAREON_COLORS.primaryDark,fontSize:29,fontWeight:'900',letterSpacing:5,marginVertical:5},codeLoading:{alignItems:'center',gap:8,justifyContent:'center'},codeLoadingText:{color:CAREON_COLORS.primaryDark,fontSize:14,fontWeight:'800'},connectionActions:{flexDirection:'row',gap:10},connectionAction:{flex:1},exitNotice:{alignItems:'center',flexDirection:'row',gap:7,justifyContent:'center',padding:14},exitText:{color:CAREON_COLORS.danger,fontSize:13,fontWeight:'800'} });
