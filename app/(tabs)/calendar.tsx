import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CareEntrance, CareScrollView, Screen, sharedStyles } from '@/components/careon/shared';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { CalendarEvent, CALENDAR_EVENTS, SAVED_PROGRAMS } from '@/lib/mock-data';
import { pushRoute } from '@/lib/navigation';
import { useNotifications } from '@/lib/notification-state';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const BASE_YEAR = 2026;
const BASE_MONTH_INDEX = 6;

type SelectedDate = {
  year: number;
  monthIndex: number;
  day: number;
};

function getEventDate(event: CalendarEvent) {
  return new Date(event.year, event.monthIndex, event.day);
}

function isSameDate(date: SelectedDate, event: CalendarEvent) {
  return date.year === event.year && date.monthIndex === event.monthIndex && date.day === event.day;
}

function formatDateLabel(date: SelectedDate) {
  const weekday = weekDays[new Date(date.year, date.monthIndex, date.day).getDay()];

  return `${date.monthIndex + 1}월 ${date.day}일 (${weekday})`;
}

function formatEventDday(event: CalendarEvent, today: Date) {
  const dayMs = 1000 * 60 * 60 * 24;
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const eventStart = getEventDate(event).getTime();
  const daysLeft = Math.round((eventStart - todayStart) / dayMs);

  if (daysLeft === 0) {
    return 'D-Day';
  }

  return daysLeft > 0 ? `D-${daysLeft}` : `D+${Math.abs(daysLeft)}`;
}

function getCalendarCells(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const currentMonthDays = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();
  const totalCells = 42;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDay + 1;

    if (dayNumber < 1) {
      return { label: String(previousMonthDays + dayNumber), disabled: true };
    }

    if (dayNumber > currentMonthDays) {
      return { label: String(dayNumber - currentMonthDays), disabled: true };
    }

    const events = CALENDAR_EVENTS.filter((item) =>
      item.year === year && item.monthIndex === monthIndex && item.day === dayNumber,
    );

    return { label: String(dayNumber), day: dayNumber, events };
  });
}

function getEventColors(events: CalendarEvent[]) {
  return Array.from(new Set(events.map((event) => event.color)));
}

export default function CalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState({ year: BASE_YEAR, monthIndex: BASE_MONTH_INDEX });
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null);
  const { hasUnreadNotifications } = useNotifications();
  const { height, width } = useWindowDimensions();
  const cardWidth = Math.min(350, width - 52);
  const cellSize = Math.floor(Math.min(290, cardWidth - 60) / 7);
  const gridWidth = cellSize * 7;
  const scheduleListBottomPadding = 16;
  const calendarScale = height < 820 ? 0.88 : height < 900 ? 0.94 : 1;
  const screenTopPadding = height < 820 ? 36 : 65;
  const calendarCardHeight = 50 + (313 * calendarScale);
  const calendarPaddingTop = 22 * calendarScale;
  const calendarPaddingBottom = 16 * calendarScale;
  const monthMarginBottom = 19 * calendarScale;
  const weekDayCellHeight = 40 * calendarScale;
  const dateCellHeight = 36 * calendarScale;
  const dateBadgeSize = Math.min(34, Math.max(30, dateCellHeight - 1));
  const scheduleGap = height < 820 ? 14 : 22;
  const scheduleCollapsedTop = screenTopPadding + calendarCardHeight + scheduleGap;
  const scheduleProgress = useRef(new Animated.Value(0)).current;
  const scheduleProgressRef = useRef(0);
  const today = useMemo(() => new Date(), []);
  const calendarCells = useMemo(
    () => getCalendarCells(visibleMonth.year, visibleMonth.monthIndex),
    [visibleMonth],
  );
  const upcomingEvents = useMemo(() => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return CALENDAR_EVENTS
      .filter((event) => getEventDate(event) >= todayStart)
      .sort((a, b) => getEventDate(a).getTime() - getEventDate(b).getTime());
  }, [today]);
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return CALENDAR_EVENTS.filter((event) => isSameDate(selectedDate, event));
  }, [selectedDate]);

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.monthIndex + direction, 1);

      return { year: next.getFullYear(), monthIndex: next.getMonth() };
    });
  };

  const animateScheduleSheet = useCallback((toValue: number) => {
    scheduleProgressRef.current = toValue;
    Animated.spring(scheduleProgress, {
      damping: 24,
      mass: 0.9,
      stiffness: 190,
      toValue,
      useNativeDriver: false,
    }).start();
  }, [scheduleProgress]);

  const scheduleSheetPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
    onPanResponderGrant: () => {
      scheduleProgress.stopAnimation((value) => {
        scheduleProgressRef.current = value;
      });
    },
    onPanResponderMove: (_, gestureState) => {
      const nextProgress = Math.max(0, Math.min(1, scheduleProgressRef.current - (gestureState.dy / scheduleCollapsedTop)));

      scheduleProgress.setValue(nextProgress);
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentProgress = Math.max(0, Math.min(1, scheduleProgressRef.current - (gestureState.dy / scheduleCollapsedTop)));
      const shouldExpand = gestureState.vy < -0.35 || (gestureState.vy <= 0.35 && currentProgress > 0.45);

      animateScheduleSheet(shouldExpand ? 1 : 0);
    },
    onPanResponderTerminate: () => {
      animateScheduleSheet(scheduleProgressRef.current > 0.5 ? 1 : 0);
    },
  }), [animateScheduleSheet, scheduleCollapsedTop, scheduleProgress]);

  const scheduleSheetTop = scheduleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [scheduleCollapsedTop, 0],
  });
  const scheduleSheetRadius = scheduleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Screen backgroundColor={CAREON_COLORS.page} contentStyle={[styles.screen, { paddingTop: screenTopPadding }]}>
      <Pressable
        accessibilityLabel="알림"
        hitSlop={12}
        onPress={() => pushRoute('/notifications')}
        style={styles.bellButton}>
        <Ionicons color={CAREON_COLORS.text} name="notifications-outline" size={25} />
        {hasUnreadNotifications ? <View style={styles.bellDot} /> : null}
      </Pressable>

      <View
        style={[
          styles.calendarCard,
          {
            height: calendarCardHeight,
            paddingBottom: calendarPaddingBottom,
            paddingTop: calendarPaddingTop,
            width: cardWidth,
          },
          sharedStyles.cardShadow,
        ]}>
        <View style={[styles.monthRow, { marginBottom: monthMarginBottom }]}>
          <Pressable accessibilityLabel="이전 달" onPress={() => moveMonth(-1)} style={styles.monthCircle}>
            <Ionicons color={CAREON_COLORS.background} name="chevron-back" size={21} />
          </Pressable>
          <Text style={styles.monthText}>{visibleMonth.year}. {visibleMonth.monthIndex + 1}</Text>
          <Pressable accessibilityLabel="다음 달" onPress={() => moveMonth(1)} style={styles.monthCircle}>
            <Ionicons color={CAREON_COLORS.background} name="chevron-forward" size={21} />
          </Pressable>
        </View>

        <View style={[styles.grid, { width: gridWidth }]}>
          {weekDays.map((day) => (
            <View key={day} style={[styles.dayCell, { height: weekDayCellHeight, width: cellSize }]}>
              <Text style={styles.weekDay}>{day}</Text>
            </View>
          ))}
          {calendarCells.map((cell, index) => {
            const events: CalendarEvent[] = 'events' in cell ? (cell.events ?? []) : [];
            const eventColors = getEventColors(events);
            const isSelected = !cell.disabled
              && selectedDate?.year === visibleMonth.year
              && selectedDate.monthIndex === visibleMonth.monthIndex
              && selectedDate.day === Number(cell.label);
            const isToday = !cell.disabled
              && visibleMonth.year === today.getFullYear()
              && visibleMonth.monthIndex === today.getMonth()
              && Number(cell.label) === today.getDate();

            return (
              <Pressable
                accessibilityRole={cell.disabled ? undefined : 'button'}
                disabled={cell.disabled}
                key={`${cell.label}-${index}`}
                onPress={() => {
                  setSelectedDate({
                    year: visibleMonth.year,
                    monthIndex: visibleMonth.monthIndex,
                    day: Number(cell.label),
                  });
                }}
                style={({ pressed }) => [
                  styles.dayCell,
                  { height: dateCellHeight, width: cellSize },
                  pressed && styles.pressedDayCell,
                ]}>
                <View
                  style={[
                    styles.dateBadge,
                    {
                      borderRadius: dateBadgeSize / 2.8,
                      height: dateBadgeSize,
                      width: dateBadgeSize,
                    },
                    isToday && styles.todayBadge,
                    isSelected && styles.selectedBadge,
                  ]}>
                  <Text style={[styles.dateText, cell.disabled && styles.disabledDate, isToday && styles.todayText, isSelected && styles.selectedText]}>
                    {cell.label}
                  </Text>
                  {eventColors.length ? (
                    <View style={styles.eventDots}>
                      {eventColors.map((eventColor) => (
                        <View key={eventColor} style={[styles.eventDot, { backgroundColor: eventColor }]} />
                      ))}
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            borderTopLeftRadius: scheduleSheetRadius,
            borderTopRightRadius: scheduleSheetRadius,
            bottom: 0,
            top: scheduleSheetTop,
          },
        ]}>
        <View {...scheduleSheetPanResponder.panHandlers} style={styles.sheetDragArea}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>예정된 일정</Text>
          </View>
        </View>
        <CareScrollView
          contentContainerStyle={[styles.ddayList, { paddingBottom: scheduleListBottomPadding }]}
          showCareScrollbar={false}>
          {upcomingEvents.length ? upcomingEvents.map((event) => {
            const program = SAVED_PROGRAMS.find((item) => item.id === event.programId);

            if (!program) {
              return null;
            }

            return (
              <View key={event.id} style={styles.ddayCard}>
                <View style={styles.ddayTopRow}>
                  <Text style={[styles.ddayLabel, { color: event.color }]}>{event.type === 'deadline' ? '마감일' : '결과 발표일'} · {event.day}일</Text>
                  <View style={[styles.ddayBadge, { borderColor: event.color }]}>
                    <Text style={[styles.ddayBadgeText, { color: event.color }]}>{formatEventDday(event, today)}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.ddayTitle}>{program.title}</Text>
              </View>
            );
          }) : (
            <View style={styles.emptyMonth}>
              <Text style={styles.emptyMonthText}>앞으로 예정된 일정이 없어요.</Text>
            </View>
          )}
        </CareScrollView>
      </Animated.View>

      {selectedDate ? (
        <View style={styles.dateOverlay}>
          <Pressable
            accessibilityLabel="선택 날짜 일정 닫기"
            onPress={() => setSelectedDate(null)}
            style={styles.overlayBackdrop}
          />
          <CareEntrance distance={8} style={styles.datePanel}>
            <View style={styles.datePanelHeader}>
              <View>
                <Text style={styles.overlayTitle}>{formatDateLabel(selectedDate)}</Text>
              </View>
              <Pressable accessibilityLabel="닫기" hitSlop={12} onPress={() => setSelectedDate(null)} style={styles.closeButton}>
                <Ionicons color={CAREON_COLORS.text} name="close" size={22} />
              </Pressable>
            </View>

            <CareScrollView contentContainerStyle={styles.overlayList} showCareScrollbar={false}>
              {selectedDateEvents.length ? selectedDateEvents.map((event) => {
                const program = SAVED_PROGRAMS.find((item) => item.id === event.programId);

                if (!program) {
                  return null;
                }

                return (
                  <View key={event.id} style={styles.overlayEventCard}>
                    <View style={[styles.overlayColorBar, { backgroundColor: event.color }]} />
                    <View style={styles.overlayEventBody}>
                      <Text style={[styles.overlayEventLabel, { color: event.color }]}>
                        {event.type === 'deadline' ? '마감일' : '결과 발표일'} · {event.day}일
                      </Text>
                      <Text numberOfLines={2} style={styles.overlayEventTitle}>{program.title}</Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.overlayEmptyCard}>
                  <Text style={styles.overlayEmptyText}>이 날짜에 저장된 일정이 없어요.</Text>
                </View>
              )}
            </CareScrollView>
          </CareEntrance>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
  },
  bellButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 15,
    top: 16,
    width: 44,
    zIndex: 2,
  },
  bellDot: {
    backgroundColor: CAREON_COLORS.danger,
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 6,
  },
  calendarCard: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 20,
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 282,
  },
  monthCircle: {
    alignItems: 'center',
    backgroundColor: '#9EEBD6',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  monthText: {
    color: CAREON_COLORS.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedDayCell: {
    opacity: 0.68,
  },
  weekDay: {
    color: CAREON_COLORS.text,
    fontSize: 14,
    fontWeight: '400',
  },
  dateBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
    width: 34,
  },
  todayBadge: {
    backgroundColor: CAREON_COLORS.primary,
    borderColor: CAREON_COLORS.primary,
    borderWidth: 1.5,
  },
  selectedBadge: {
    backgroundColor: CAREON_COLORS.background,
    borderColor: CAREON_COLORS.primary,
    borderWidth: 1.5,
  },
  dateText: {
    color: '#7B7B7B',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledDate: {
    color: '#C5C5C5',
  },
  todayText: {
    color: CAREON_COLORS.background,
    fontWeight: '800',
  },
  selectedText: {
    color: CAREON_COLORS.primaryDark,
    fontWeight: '700',
  },
  eventDots: {
    bottom: 3,
    flexDirection: 'row',
    gap: 3,
    position: 'absolute',
  },
  eventDot: {
    borderRadius: 2.5,
    height: 5,
    width: 5,
  },
  bottomSheet: {
    backgroundColor: CAREON_COLORS.background,
    bottom: 0,
    left: 0,
    paddingHorizontal: 33,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  sheetDragArea: {
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: CAREON_COLORS.line,
    borderRadius: 20,
    height: 5,
    marginBottom: 18,
    width: 46,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    color: CAREON_COLORS.title,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
    marginTop: 4,
  },
  ddayList: {
    gap: 14,
  },
  ddayCard: {
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 12,
    gap: 7,
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  ddayTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ddayLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  ddayBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ddayBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  ddayTitle: {
    color: CAREON_COLORS.title,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  emptyMonth: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 64,
  },
  emptyMonthText: {
    color: CAREON_COLORS.muted,
    fontSize: 13,
  },
  dateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(68, 68, 68, 0.42)',
  },
  datePanel: {
    aspectRatio: 0.82,
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 28,
    paddingBottom: 20,
    paddingHorizontal: 28,
    paddingTop: 24,
    maxWidth: 360,
    width: '86%',
    ...sharedStyles.cardShadow,
  },
  datePanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  overlayTitle: {
    color: CAREON_COLORS.title,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  overlayList: {
    gap: 14,
    paddingBottom: 112,
  },
  overlayEventCard: {
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 14,
    minHeight: 104,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  overlayColorBar: {
    borderRadius: 6,
    width: 6,
  },
  overlayEventBody: {
    flex: 1,
    gap: 7,
    justifyContent: 'center',
  },
  overlayEventLabel: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 17,
  },
  overlayEventTitle: {
    color: CAREON_COLORS.title,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  overlayEventMeta: {
    color: CAREON_COLORS.text,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  overlayEmptyCard: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 112,
    paddingHorizontal: 18,
  },
  overlayEmptyText: {
    color: CAREON_COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
