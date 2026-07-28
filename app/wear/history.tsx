import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Header, Screen } from '@/components/careon/shared';
import { CAREON_COLORS, CAREON_SHADOW } from '@/lib/careon-theme';
import { replaceRoute } from '@/lib/navigation';
import { EmergencyEvent, SafeZoneEvent, useWear } from '@/lib/wear-state';

type Tab = 'timeline' | 'sos' | 'zone';
type HistoryItem = EmergencyEvent | SafeZoneEvent;
type HistoryCursors = { sos: string | null; zone: string | null };
const HISTORY_LIMIT = 5;
const formatDate = (value: string) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(value));
const occurredAt = (item: HistoryItem) => 'requestedAt' in item ? item.requestedAt : item.detectedAt;
const sortNewestFirst = (items: HistoryItem[]) => [...items].sort((left, right) => new Date(occurredAt(right)).getTime() - new Date(occurredAt(left)).getTime());

export default function WearHistoryScreen() {
  const { getEmergencyHistory, getSafeZoneHistory } = useWear();
  const [tab, setTab] = useState<Tab>('timeline');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [nextCursors, setNextCursors] = useState<HistoryCursors>({ sos: null, zone: null });
  const [loading, setLoading] = useState(true);
  const [tabLayouts, setTabLayouts] = useState<Record<Tab, { width: number; x: number }>>({
    timeline: { width: 0, x: 0 },
    sos: { width: 0, x: 0 },
    zone: { width: 0, x: 0 },
  });
  const selectedTabX = useSharedValue(0);
  const selectedTabLayout = tabLayouts[tab];
  const selectedTabStyle = useAnimatedStyle(() => ({ transform: [{ translateX: selectedTabX.value }] }));
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'timeline') {
        const [sosPage, zonePage] = await Promise.all([
          getEmergencyHistory(null, HISTORY_LIMIT),
          getSafeZoneHistory(null, HISTORY_LIMIT),
        ]);
        setItems(sortNewestFirst([...sosPage.items, ...zonePage.items]));
        setNextCursors({ sos: sosPage.nextCursor, zone: zonePage.nextCursor });
      } else {
        const page = tab === 'sos'
          ? await getEmergencyHistory(null, HISTORY_LIMIT)
          : await getSafeZoneHistory(null, HISTORY_LIMIT);
        setItems(page.items);
        setNextCursors(tab === 'sos' ? { sos: page.nextCursor, zone: null } : { sos: null, zone: page.nextCursor });
      }
    } catch (error) { Alert.alert('이력 조회 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'); }
    finally { setLoading(false); }
  }, [getEmergencyHistory, getSafeZoneHistory, tab]);
  useEffect(() => { void load(); }, [load]);
  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'timeline') {
        const [sosPage, zonePage] = await Promise.all([
          nextCursors.sos ? getEmergencyHistory(nextCursors.sos, HISTORY_LIMIT) : Promise.resolve(null),
          nextCursors.zone ? getSafeZoneHistory(nextCursors.zone, HISTORY_LIMIT) : Promise.resolve(null),
        ]);
        setItems((current) => sortNewestFirst([...current, ...(sosPage?.items ?? []), ...(zonePage?.items ?? [])]));
        setNextCursors({ sos: sosPage?.nextCursor ?? null, zone: zonePage?.nextCursor ?? null });
      } else if (tab === 'sos' && nextCursors.sos) {
        const page = await getEmergencyHistory(nextCursors.sos, HISTORY_LIMIT);
        setItems((current) => [...current, ...page.items]);
        setNextCursors({ sos: page.nextCursor, zone: null });
      } else if (tab === 'zone' && nextCursors.zone) {
        const page = await getSafeZoneHistory(nextCursors.zone, HISTORY_LIMIT);
        setItems((current) => [...current, ...page.items]);
        setNextCursors({ sos: null, zone: page.nextCursor });
      }
    } catch (error) { Alert.alert('이력 조회 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'); }
    finally { setLoading(false); }
  }, [getEmergencyHistory, getSafeZoneHistory, nextCursors, tab]);
  const handleSelectTab = (nextTab: Tab) => {
    setItems([]);
    setNextCursors({ sos: null, zone: null });
    setTab(nextTab);
    selectedTabX.value = withTiming(tabLayouts[nextTab].x, { duration: 220 });
  };
  const handleTabLayout = (key: Tab, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    setTabLayouts((current) => ({ ...current, [key]: { width, x } }));
    if (key === tab) selectedTabX.value = x;
  };
  return <Screen scroll backgroundColor={CAREON_COLORS.page} contentStyle={styles.content}>
    <Header onBack={() => replaceRoute('/wear')} style={styles.header} title="돌봄 이력" />
    <View accessibilityRole="tablist" style={styles.tabs}><Animated.View pointerEvents="none" style={[styles.tabIndicator, { opacity: selectedTabLayout.width ? 1 : 0, width: selectedTabLayout.width }, selectedTabStyle]} />{([['timeline', '전체'], ['sos', 'SOS'], ['zone', '안심 구역']] as const).map(([key, label]) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === key }} key={key} onLayout={(event) => handleTabLayout(key, event)} onPress={() => handleSelectTab(key)} style={styles.tab}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</View>
    {loading && !items.length ? <ActivityIndicator color={CAREON_COLORS.primaryDark} style={styles.loader} /> : null}
    {!loading && !items.length ? <View style={styles.empty}><Ionicons color={CAREON_COLORS.faint} name="file-tray-outline" size={38} /><Text style={styles.emptyText}>아직 기록이 없어요.</Text></View> : null}
    {items.map((item) => <View key={`${tab}-${item.id}`} style={styles.card}>{'requestedAt' in item ? <><Text style={styles.cardTitle}>{item.acknowledged ? '확인된 SOS 요청' : 'SOS 도움 요청'}</Text><Text style={styles.caption}>{formatDate(item.requestedAt)} · 심박 {item.heartRateBpm ?? '—'} BPM</Text></> : <><Text style={styles.cardTitle}>안심 구역 이탈 {item.response ? `· ${item.response}` : '· 응답 대기'}</Text><Text style={styles.caption}>{formatDate(item.detectedAt)}</Text></>}</View>)}
    {nextCursors.sos || nextCursors.zone ? <Pressable disabled={loading} onPress={() => void loadMore()} style={styles.more}><Text style={styles.moreText}>{loading ? '불러오는 중…' : '이전 기록 더 보기'}</Text></Pressable> : null}
  </Screen>;
}
const styles = StyleSheet.create({ content:{padding:24,paddingTop:20},header:{marginHorizontal:-24},tabs:{backgroundColor:'#EBEBEB',borderRadius:14,flexDirection:'row',marginBottom:18,padding:4},tab:{alignItems:'center',borderRadius:10,flex:1,paddingVertical:10},tabIndicator:{backgroundColor:CAREON_COLORS.background,borderRadius:10,bottom:4,left:0,position:'absolute',top:4},tabText:{color:CAREON_COLORS.muted,fontSize:13,fontWeight:'800'},tabTextActive:{color:CAREON_COLORS.primaryDark},loader:{marginTop:40},empty:{alignItems:'center',gap:10,paddingTop:55},emptyText:{color:CAREON_COLORS.muted,fontWeight:'700'},card:{backgroundColor:CAREON_COLORS.background,borderRadius:18,marginBottom:10,padding:16,...CAREON_SHADOW},cardTitle:{color:CAREON_COLORS.title,fontSize:15,fontWeight:'900'},caption:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'600',marginTop:7},more:{alignItems:'center',padding:18},moreText:{color:CAREON_COLORS.primaryDark,fontSize:13,fontWeight:'800'} });
