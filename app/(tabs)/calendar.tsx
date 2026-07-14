import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Screen, sharedStyles } from '@/components/careon/shared';
import { useChecklist } from '@/lib/checklist-state';
import { CAREON_COLORS } from '@/lib/careon-theme';
import { CalendarEvent, CALENDAR_EVENTS, SAVED_PROGRAMS } from '@/lib/mock-data';
import { pushRoute } from '@/lib/navigation';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const BASE_YEAR = 2026;
const BASE_MONTH_INDEX = 6;

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

function getEventColor(events: CalendarEvent[]) {
  if (events.some((event) => event.type === 'deadline')) {
    return CAREON_COLORS.danger;
  }

  if (events.some((event) => event.type === 'result')) {
    return CAREON_COLORS.blue;
  }

  return undefined;
}

export default function CalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState({ year: BASE_YEAR, monthIndex: BASE_MONTH_INDEX });
  const { checkedDocuments, getDocumentKey } = useChecklist();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(350, width - 52);
  const gridWidth = Math.min(290, cardWidth - 60);
  const cellSize = gridWidth / 7;
  const today = new Date();
  const calendarCells = useMemo(
    () => getCalendarCells(visibleMonth.year, visibleMonth.monthIndex),
    [visibleMonth],
  );
  const monthlyEvents = useMemo(() => {
    return CALENDAR_EVENTS.filter((event) => event.year === visibleMonth.year && event.monthIndex === visibleMonth.monthIndex);
  }, [visibleMonth]);

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.monthIndex + direction, 1);

      return { year: next.getFullYear(), monthIndex: next.getMonth() };
    });
  };

  return (
    <Screen backgroundColor={CAREON_COLORS.page} contentStyle={styles.screen}>
      <Pressable
        accessibilityLabel="알림"
        hitSlop={12}
        onPress={() => pushRoute('/notifications')}
        style={styles.bellButton}>
        <Ionicons color={CAREON_COLORS.text} name="notifications-outline" size={25} />
        <View style={styles.bellDot} />
      </Pressable>

      <View style={[styles.calendarCard, { width: cardWidth }, sharedStyles.cardShadow]}>
        <View style={styles.monthRow}>
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
            <View key={day} style={[styles.dayCell, { height: 40, width: cellSize }]}>
              <Text style={styles.weekDay}>{day}</Text>
            </View>
          ))}
          {calendarCells.map((cell, index) => {
            const events: CalendarEvent[] = 'events' in cell ? (cell.events ?? []) : [];
            const eventColor = getEventColor(events);
            const isToday = !cell.disabled
              && visibleMonth.year === today.getFullYear()
              && visibleMonth.monthIndex === today.getMonth()
              && Number(cell.label) === today.getDate();

            return (
              <View key={`${cell.label}-${index}`} style={[styles.dayCell, { height: 36, width: cellSize }]}>
                <View style={[styles.dateBadge, isToday && styles.todayBadge]}>
                  <Text style={[styles.dateText, cell.disabled && styles.disabledDate, isToday && styles.todayText]}>
                    {cell.label}
                  </Text>
                  {eventColor ? <View style={[styles.eventDot, { backgroundColor: eventColor }]} /> : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <ScrollView contentContainerStyle={styles.ddayList} showsVerticalScrollIndicator={false}>
          {monthlyEvents.length ? monthlyEvents.map((event) => {
            const program = SAVED_PROGRAMS.find((item) => item.id === event.programId);

            if (!program) {
              return null;
            }

            return (
              <View key={event.id} style={styles.ddayCard}>
                <Text style={[styles.ddayLabel, { color: event.color }]}>{event.type === 'deadline' ? '마감일' : '결과 발표일'} · {event.day}일</Text>
                <Text numberOfLines={1} style={styles.ddayTitle}>{program.title}</Text>
                {program.documents.length ? (
                  <View style={styles.ddayDocs}>
                    <Text style={styles.ddayMetaPrefix}>필요 서류 | </Text>
                    {program.documents.map((document, documentIndex) => {
                      const checked = checkedDocuments[getDocumentKey(program.id, document.title)];

                      return (
                        <Text
                          key={document.title}
                          numberOfLines={1}
                          style={[styles.ddayMeta, checked && styles.checkedDocText]}>
                          {document.title}{documentIndex < program.documents.length - 1 ? ', ' : ''}
                        </Text>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          }) : (
            <View style={styles.emptyMonth}>
              <Text style={styles.emptyMonthText}>이번 달에 저장된 일정이 없어요.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    paddingTop: 65,
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
    right: 11,
    top: 11,
    width: 6,
  },
  calendarCard: {
    alignItems: 'center',
    backgroundColor: CAREON_COLORS.background,
    borderRadius: 20,
    minHeight: 363,
    height: 363,
    paddingBottom: 16,
    paddingTop: 22,
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 19,
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
    color: CAREON_COLORS.primaryDark,
    fontWeight: '700',
  },
  eventDot: {
    borderRadius: 2.5,
    bottom: 3,
    height: 5,
    position: 'absolute',
    width: 5,
  },
  bottomSheet: {
    alignSelf: 'stretch',
    backgroundColor: CAREON_COLORS.background,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    flex: 1,
    marginTop: 22,
    paddingHorizontal: 33,
    paddingTop: 12,
    ...sharedStyles.cardShadow,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: CAREON_COLORS.line,
    borderRadius: 20,
    height: 5,
    marginBottom: 24,
    width: 46,
  },
  ddayList: {
    gap: 18,
    paddingBottom: 26,
  },
  ddayCard: {
    backgroundColor: CAREON_COLORS.page,
    borderRadius: 12,
    gap: 8,
    minHeight: 64,
    paddingHorizontal: 19,
    paddingVertical: 15,
  },
  ddayLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  ddayTitle: {
    color: CAREON_COLORS.title,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  ddayDocs: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ddayMetaPrefix: {
    color: CAREON_COLORS.text,
    fontSize: 11,
    lineHeight: 14,
  },
  ddayMeta: {
    color: CAREON_COLORS.text,
    fontSize: 11,
    lineHeight: 14,
  },
  checkedDocText: {
    color: CAREON_COLORS.faint,
    textDecorationLine: 'line-through',
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
});
