import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { api } from '../../lib/api';
import type { CalendarDay } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * 6) / 7;
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const PRIORITY_COLORS: Record<number, string> = { 1: '#10B981', 2: '#F59E0B', 3: '#EF4444' };

export default function CalendarScreen() {
  const colors = useColors();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    const res = await api.calendar.getMonth(currentYear, currentMonth);
    setDays(res.data?.days || []);
    setLoading(false);
  };

  const dayMap = useMemo(() => {
    const map: Record<string, CalendarDay> = {};
    days.forEach(d => { map[d.date] = d; });
    return map;
  }, [days]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0=Mon, 6=Sun
    const totalDays = lastDay.getDate();

    const cells: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
    
    // 填充前置空白
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      cells.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false });
    }
    
    // 填充当月日期
    for (let d = 1; d <= totalDays; d++) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date, day: d, isCurrentMonth: true });
    }
    
    // 填充后置空白
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(currentYear, currentMonth, i);
        cells.push({ date: d.toISOString().split('T')[0], day: d.getDate(), isCurrentMonth: false });
      }
    }
    
    return cells;
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentYear(currentYear - 1); setCurrentMonth(12); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentYear(currentYear + 1); setCurrentMonth(1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const today = new Date().toISOString().split('T')[0];
  const selectedDayData = selectedDate ? dayMap[selectedDate] : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      {/* 月份切换器 */}
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.gray[900] }]}>
          {currentYear}年{currentMonth}月
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
      </View>

      {/* 星期标题 */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.weekdayText, { color: i >= 5 ? colors.danger : colors.gray[500] }]}>{d}</Text>
        ))}
      </View>

      {/* 日历网格 */}
      <View style={[styles.calendarGrid, { backgroundColor: colors.white }]}>
        {calendarGrid.map((cell, idx) => {
          const dayData = dayMap[cell.date];
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const hasTodos = dayData?.todos?.length > 0;
          const hasEvents = dayData?.events?.length > 0;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md },
                isToday && styles.todayCell,
              ]}
              onPress={() => setSelectedDate(cell.date === selectedDate ? null : cell.date)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayText,
                { color: cell.isCurrentMonth ? colors.gray[800] : colors.gray[300] },
                isToday && { color: colors.primary, fontWeight: fontWeight.bold },
              ]}>
                {cell.day}
              </Text>
              {(hasTodos || hasEvents) && (
                <View style={styles.dotRow}>
                  {hasTodos && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                  {hasEvents && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
                </View>
              )}
              {isToday && <View style={[styles.todayIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 选中日期详情 */}
      {selectedDate && (
        <View style={[styles.detailCard, { backgroundColor: colors.white }]}>
          <Text style={[styles.detailDate, { color: colors.gray[900] }]}>
            {selectedDate.replace(/-/g, '/')}
          </Text>
          
          {selectedDayData?.todos?.map(todo => (
            <View key={todo.id} style={[styles.todoItem, { borderBottomColor: colors.gray[100] }]}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[todo.priority] || colors.gray[400] }]} />
              <Text style={[
                styles.todoText,
                { color: todo.completed ? colors.gray[400] : colors.gray[800] },
                todo.completed && { textDecorationLine: 'line-through' },
              ]}>
                {todo.title}
              </Text>
              {todo.completed && (
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
              )}
            </View>
          ))}

          {selectedDayData?.events?.map((event, idx) => (
            <View key={idx} style={[styles.eventItem, { borderBottomColor: colors.gray[100] }]}>
              <MaterialCommunityIcons
                name={(event.type === 'expiry' ? 'calendar-remove' : 'autorenew') as any}
                size={16}
                color={event.type === 'expiry' ? colors.warning : colors.secondary}
              />
              <Text style={[styles.eventText, { color: colors.gray[800] }]}>{event.description}</Text>
            </View>
          ))}

          {!selectedDayData && (
            <Text style={[styles.emptyText, { color: colors.gray[400] }]}>当日无待办或事件</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  monthText: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.sm },
  weekdayText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, width: DAY_SIZE, height: 24, textAlign: 'center', alignItems: 'center' },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayCell: {},
  dayText: { fontSize: fontSize.base },
  todayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  detailCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  detailDate: { fontSize: fontSize.xl, fontWeight: fontWeight.semiBold, marginBottom: spacing.md },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  todoText: { flex: 1, fontSize: fontSize.base },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  eventText: { flex: 1, fontSize: fontSize.base },
  emptyText: { fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.lg },
});
