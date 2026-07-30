import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated as NativeAnimated, LayoutChangeEvent, Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MapView, { Marker } from 'react-native-maps';

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
const responseLabel: Record<string, string> = { USER_OKAY: '워치에서 괜찮다고 응답했어요.', NEED_HELP: '워치에서 도움이 필요하다고 응답했어요.', NO_RESPONSE: '워치 응답 시간이 지났어요.' };

export default function WearHistoryScreen() {
  const { getEmergencyHistory, getSafeZoneHistory } = useWear();
  const [tab, setTab] = useState<Tab>('timeline');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [nextCursors, setNextCursors] = useState<HistoryCursors>({ sos: null, zone: null });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
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
    if (nextTab === tab) return;
    setLoading(true);
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
    {items.map((item) => <Pressable accessibilityHint="이벤트 상세 기록을 엽니다." accessibilityLabel={getItemTitle(item)} accessibilityRole="button" key={`${tab}-${item.id}`} onPress={() => setSelectedItem(item)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>{'requestedAt' in item ? <><View style={styles.cardHeading}><Text style={styles.cardTitle}>{getItemTitle(item)}</Text><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={18} /></View><Text style={styles.caption}>{formatDate(item.requestedAt)} · 심박 {item.heartRateBpm ?? '—'} BPM</Text></> : <><View style={styles.cardHeading}><Text style={styles.cardTitle}>{getItemTitle(item)}</Text><Ionicons color={CAREON_COLORS.faint} name="chevron-forward" size={18} /></View><Text style={styles.caption}>{formatDate(item.detectedAt)}</Text></>}</Pressable>)}
    {nextCursors.sos || nextCursors.zone ? <Pressable disabled={loading} onPress={() => void loadMore()} style={styles.more}><Text style={styles.moreText}>{loading ? '불러오는 중…' : '이전 기록 더 보기'}</Text></Pressable> : null}
    <EventLogOverlay item={selectedItem} onClose={() => setSelectedItem(null)} />
  </Screen>;
}

function getItemTitle(item: HistoryItem) {
  return 'requestedAt' in item ? item.acknowledged ? '확인된 SOS 요청' : 'SOS 도움 요청' : `안심 구역 이탈${item.response ? ` · ${item.response}` : ' · 응답 대기'}`;
}

function EventLogOverlay({ item, onClose }: { item: HistoryItem | null; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const sheetHiddenY = Math.round(height * 0.9);
  const sheetTranslateY = useRef(new NativeAnimated.Value(sheetHiddenY)).current;
  const isClosing = useRef(false);
  const closeOverlay = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    NativeAnimated.timing(sheetTranslateY, { duration: 210, toValue: sheetHiddenY, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [onClose, sheetHiddenY, sheetTranslateY]);
  const restoreSheet = useCallback(() => {
    NativeAnimated.spring(sheetTranslateY, { damping: 24, mass: 0.9, stiffness: 190, toValue: 0, useNativeDriver: true }).start();
  }, [sheetTranslateY]);
  const sheetPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderGrant: () => sheetTranslateY.stopAnimation(),
    onPanResponderMove: (_, gestureState) => sheetTranslateY.setValue(Math.max(0, gestureState.dy)),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > height * 0.18 || gestureState.vy > 0.65) closeOverlay();
      else restoreSheet();
    },
    onPanResponderTerminate: restoreSheet,
  }), [closeOverlay, height, restoreSheet, sheetTranslateY]);

  useEffect(() => {
    if (!item) return;
    isClosing.current = false;
    sheetTranslateY.setValue(sheetHiddenY);
    restoreSheet();
  }, [item, restoreSheet, sheetHiddenY, sheetTranslateY]);

  if (!item) return null;
  const isEmergency = 'requestedAt' in item;
  const latitude = item.latitude;
  const longitude = item.longitude;
  const canShowMap = latitude != null && longitude != null;
  const openMap = () => { if (canShowMap) void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`); };
  const backdropOpacity = sheetTranslateY.interpolate({ extrapolate: 'clamp', inputRange: [0, sheetHiddenY], outputRange: [1, 0] });

  return <Modal animationType="none" onRequestClose={closeOverlay} statusBarTranslucent transparent visible>
    <View style={styles.overlay}>
      <NativeAnimated.View pointerEvents="none" style={[styles.animatedBackdrop, { opacity: backdropOpacity }]} />
      <Pressable accessibilityLabel="상세 기록 닫기" onPress={closeOverlay} style={styles.overlayBackdrop} />
      <NativeAnimated.View accessibilityViewIsModal style={[styles.logSheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        <View {...sheetPanResponder.panHandlers} style={styles.sheetDragArea}><View style={styles.sheetHandle} /></View>
        <View style={styles.logHeader}><View>{!isEmergency ? <Text style={styles.logEyebrow}>안심 구역 이벤트 로그</Text> : null}<Text style={[styles.logTitle, isEmergency && styles.logTitleWithoutEyebrow]}>{getItemTitle(item)}</Text></View><Pressable accessibilityLabel="상세 기록 닫기" accessibilityRole="button" hitSlop={10} onPress={closeOverlay} style={styles.closeButton}><Ionicons color={CAREON_COLORS.muted} name="close" size={22} /></Pressable></View>
        <ScrollView bounces={false} contentContainerStyle={styles.logContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logCard}>
            {isEmergency ? <>
              <LogRow icon="time-outline" label="요청 시각" value={formatDate(item.requestedAt)} />
              <LogRow icon="heart-outline" label="마지막 심박수" value={item.heartRateBpm == null ? '정보 없음' : `${item.heartRateBpm} BPM`} />
              <LogRow icon="checkmark-circle-outline" label="확인 상태" value={item.acknowledged ? '보호자가 확인했어요' : '확인 대기 중'} />
              <LogRow icon="location-outline" label="위치 정보" value={item.locationLabel} />
              {item.capturedAt ? <LogRow icon="time-outline" label="GPS 측정 시각" value={formatDate(item.capturedAt)} /> : null}
            </> : <>
              <LogRow icon="time-outline" label="이탈 감지 시각" value={formatDate(item.detectedAt)} />
              <LogRow icon="time-outline" label="GPS 측정 시각" value={formatDate(item.capturedAt)} />
              <LogRow icon="chatbubble-ellipses-outline" label="워치 응답" value={item.response ? responseLabel[item.response] ?? item.response : '응답을 기다리고 있어요'} />
            </>}
            {item.accuracyMeters != null ? <LogRow icon="navigate-outline" label="위치 정확도" value={`±${item.accuracyMeters}m`} /> : null}
          </View>
          {canShowMap ? <><View style={styles.mapCard}><MapView initialRegion={{ latitude, longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 }} scrollEnabled={false} style={styles.map} zoomEnabled={false}><Marker coordinate={{ latitude, longitude }} title={isEmergency ? 'SOS 요청 위치' : '이탈 감지 위치'} /></MapView><View style={styles.mapCaption}><Ionicons color={CAREON_COLORS.primaryDark} name="location" size={17} /><Text style={styles.mapCaptionText}>{isEmergency ? '도움을 요청한 위치' : '안심 구역 이탈 감지 위치'}</Text></View></View><Pressable accessibilityRole="button" onPress={openMap} style={styles.mapButton}><Text style={styles.mapButtonText}>지도에서 보기</Text><Ionicons color={CAREON_COLORS.primaryDark} name="open-outline" size={17} /></Pressable></> : <View style={styles.noLocation}><Ionicons color={CAREON_COLORS.faint} name="location-outline" size={22} /><Text style={styles.noLocationText}>이 이벤트에는 저장된 위치 정보가 없어요.</Text></View>}
        </ScrollView>
      </NativeAnimated.View>
    </View>
  </Modal>;
}

function LogRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.logRow}><Ionicons color={CAREON_COLORS.primaryDark} name={icon} size={18} /><Text style={styles.logLabel}>{label}</Text><Text style={styles.logValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({ content:{padding:24,paddingTop:20},header:{marginHorizontal:-24},tabs:{backgroundColor:'#EBEBEB',borderRadius:14,flexDirection:'row',marginBottom:18,padding:4},tab:{alignItems:'center',borderRadius:10,flex:1,paddingVertical:10},tabIndicator:{backgroundColor:CAREON_COLORS.background,borderRadius:10,bottom:4,left:0,position:'absolute',top:4},tabText:{color:CAREON_COLORS.muted,fontSize:13,fontWeight:'800'},tabTextActive:{color:CAREON_COLORS.primaryDark},loader:{marginTop:40},empty:{alignItems:'center',gap:10,paddingTop:55},emptyText:{color:CAREON_COLORS.muted,fontWeight:'700'},card:{backgroundColor:CAREON_COLORS.background,borderRadius:18,marginBottom:10,padding:16,...CAREON_SHADOW},cardPressed:{opacity:0.72,transform:[{scale:0.99}]},cardHeading:{alignItems:'center',flexDirection:'row',justifyContent:'space-between'},cardTitle:{color:CAREON_COLORS.title,fontSize:15,fontWeight:'900'},caption:{color:CAREON_COLORS.muted,fontSize:12,fontWeight:'600',marginTop:7},more:{alignItems:'center',padding:18},moreText:{color:CAREON_COLORS.primaryDark,fontSize:13,fontWeight:'800'},overlay:{flex:1,justifyContent:'flex-end'},animatedBackdrop:{backgroundColor:'rgba(20, 34, 43, 0.5)',bottom:0,left:0,position:'absolute',right:0,top:0},overlayBackdrop:{bottom:0,left:0,position:'absolute',right:0,top:0},logSheet:{backgroundColor:CAREON_COLORS.page,borderTopLeftRadius:28,borderTopRightRadius:28,maxHeight:'88%'},sheetDragArea:{paddingBottom:10,paddingTop:10},sheetHandle:{alignSelf:'center',backgroundColor:'#D8DEE0',borderRadius:3,height:5,width:42},logHeader:{alignItems:'center',flexDirection:'row',justifyContent:'space-between',paddingBottom:18,paddingHorizontal:22,paddingTop:7},logEyebrow:{color:CAREON_COLORS.primaryDark,fontSize:12,fontWeight:'800'},logTitle:{color:CAREON_COLORS.title,fontSize:20,fontWeight:'900',marginTop:4},logTitleWithoutEyebrow:{marginTop:0},closeButton:{alignItems:'center',backgroundColor:'#EDF0F1',borderRadius:18,height:36,justifyContent:'center',width:36},logContent:{paddingBottom:30,paddingHorizontal:22},logCard:{backgroundColor:CAREON_COLORS.background,borderRadius:20,overflow:'hidden',...CAREON_SHADOW},logRow:{alignItems:'center',borderBottomColor:'#EBEBEB',borderBottomWidth:1,flexDirection:'row',gap:9,minHeight:56,paddingHorizontal:15},logLabel:{color:CAREON_COLORS.text,fontSize:13,fontWeight:'800'},logValue:{color:CAREON_COLORS.muted,flex:1,fontSize:12,fontWeight:'700',lineHeight:18,textAlign:'right'},mapCard:{backgroundColor:CAREON_COLORS.background,borderRadius:20,marginTop:16,overflow:'hidden',...CAREON_SHADOW},map:{height:190,width:'100%'},mapCaption:{alignItems:'center',flexDirection:'row',gap:6,paddingHorizontal:15,paddingVertical:12},mapCaptionText:{color:CAREON_COLORS.primaryDark,fontSize:13,fontWeight:'800'},mapButton:{alignItems:'center',backgroundColor:CAREON_COLORS.background,borderColor:CAREON_COLORS.primaryDark,borderRadius:14,borderWidth:1,flexDirection:'row',gap:7,justifyContent:'center',marginTop:12,paddingVertical:14},mapButtonText:{color:CAREON_COLORS.primaryDark,fontSize:14,fontWeight:'900'},noLocation:{alignItems:'center',backgroundColor:'#EDF0F1',borderRadius:18,gap:7,marginTop:16,padding:18},noLocationText:{color:CAREON_COLORS.muted,fontSize:13,fontWeight:'700'} });
