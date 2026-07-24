import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import type { CalendarDay } from '../../types';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const PRIORITY_COLORS: Record<number, string> = {
  1: '#10A66E',
  2: '#D89400',
  3: '#E84A5F',
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarScreen() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    void fetchCalendarData();
  }, [currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    const res = await api.calendar.getMonth(currentYear, currentMonth);
    const monthDays = res.data?.days || [];
    setDays(monthDays);
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  };

  const dayMap = useMemo(() => {
    const map: Record<string, CalendarDay> = {};
    days.forEach((item) => {
      map[item.date] = item;
    });
    return map;
  }, [days]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalDays = lastDay.getDate();

    const cells: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

    for (let i = startDayOfWeek - 1; i >= 0; i -= 1) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      cells.push({ date: formatLocalDate(date), day: date.getDate(), isCurrentMonth: false });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ date, day, isCurrentMonth: true });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i += 1) {
        const date = new Date(currentYear, currentMonth, i);
        cells.push({ date: formatLocalDate(date), day: date.getDate(), isCurrentMonth: false });
      }
    }

    return cells;
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((value) => value - 1);
      setCurrentMonth(12);
      return;
    }
    setCurrentMonth((value) => value - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((value) => value + 1);
      setCurrentMonth(1);
      return;
    }
    setCurrentMonth((value) => value + 1);
  };

  const today = new Date().toISOString().split('T')[0];
  const selectedDayData = selectedDate ? dayMap[selectedDate] : null;
  const selectedTodoCount = selectedDayData?.todos?.length || 0;
  const selectedEventCount = selectedDayData?.events?.length || 0;
  const calendarWeeks = useMemo(() => {
    const weeks: typeof calendarGrid[] = [];
    for (let index = 0; index < calendarGrid.length; index += 7) {
      weeks.push(calendarGrid.slice(index, index + 7));
    }
    return weeks;
  }, [calendarGrid]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.toolbarCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.monthNavBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
          onPress={prevMonth}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="chevron-left" size={18} color={palette.text} />
        </TouchableOpacity>
        <View style={styles.monthCopy}>
          <Text style={[styles.monthLabel, { color: palette.textSecondary }]}>当前月份</Text>
          <Text style={[styles.monthValue, { color: palette.text }]}>{`${currentYear}年${currentMonth}月`}</Text>
        </View>
        <TouchableOpacity
          style={[styles.monthNavBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
          onPress={nextMonth}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="chevron-right" size={18} color={palette.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.calendarCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((weekday, index) => (
            <Text
              key={weekday}
              style={[
                styles.weekdayText,
                { color: index >= 5 ? palette.danger : palette.textMuted },
              ]}
            >
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {calendarWeeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {week.map((cell) => {
                const dayData = dayMap[cell.date];
                const isToday = cell.date === today;
                const isSelected = cell.date === selectedDate;
                const hasTodos = Boolean(dayData?.todos?.length);
                const hasEvents = Boolean(dayData?.events?.length);

                return (
                  <TouchableOpacity
                    key={cell.date}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: isSelected ? `${palette.orange}14` : 'transparent',
                        borderColor: isSelected ? palette.orange : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedDate(cell.date)}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: cell.isCurrentMonth ? palette.text : palette.textDisabled,
                          fontWeight: isToday ? fontWeight.bold : fontWeight.medium,
                        },
                      ]}
                    >
                      {cell.day}
                    </Text>

                    {(hasTodos || hasEvents) && (
                      <View style={styles.dotRow}>
                        {hasTodos && <View style={[styles.dot, { backgroundColor: palette.orange }]} />}
                        {hasEvents && <View style={[styles.dot, { backgroundColor: palette.violet }]} />}
                      </View>
                    )}

                    {isToday && <View style={[styles.todayIndicator, { backgroundColor: palette.orange }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.detailHeader}>
          <View>
            <Text style={[styles.detailEyebrow, { color: palette.textSecondary }]}>日期详情</Text>
            <Text style={[styles.detailDate, { color: palette.text }]}>
              {selectedDate ? selectedDate.replace(/-/g, '/') : '未选择日期'}
            </Text>
          </View>
          <Text style={[styles.detailMeta, { color: palette.textMuted }]}>
            {selectedTodoCount + selectedEventCount > 0 ? `${selectedTodoCount + selectedEventCount} 条记录` : '暂无记录'}
          </Text>
        </View>

        {selectedDayData?.todos?.map((todo) => (
          <View key={todo.id} style={[styles.detailRow, { borderColor: palette.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[todo.priority] || palette.textMuted }]} />
            </View>
            <View style={styles.rowCopy}>
              <Text
                style={[
                  styles.rowTitle,
                  { color: todo.completed ? palette.textMuted : palette.text },
                  todo.completed && { textDecorationLine: 'line-through' },
                ]}
              >
                {todo.title}
              </Text>
              <Text style={[styles.rowMeta, { color: palette.textMuted }]}>
                {todo.completed ? '已完成待办' : '待办事项'}
              </Text>
            </View>
            {todo.completed && <MaterialCommunityIcons name="check-circle" size={18} color={palette.success} />}
          </View>
        ))}

        {selectedDayData?.events?.map((event, index) => (
          <View key={`${event.type}-${index}`} style={[styles.detailRow, { borderColor: palette.border }]}>
            <View style={[styles.rowIconWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <MaterialCommunityIcons
                name={(event.type === 'expiry' ? 'calendar-remove-outline' : 'autorenew') as any}
                size={16}
                color={event.type === 'expiry' ? palette.warning : palette.violet}
              />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>{event.description}</Text>
              <Text style={[styles.rowMeta, { color: palette.textMuted }]}>
                {event.type === 'expiry' ? '到期提醒' : '循环提醒'}
              </Text>
            </View>
          </View>
        ))}

        {selectedTodoCount + selectedEventCount === 0 && (
          <View style={[styles.emptyPanel, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={24} color={palette.textMuted} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>当日无待办或事件</Text>
            <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>切换其他日期，查看对应的待办和提醒安排。</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  toolbarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCopy: { alignItems: 'center' },
  monthLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, marginBottom: 2 },
  monthValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold },
  calendarCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.sm },
  weekdayText: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, textAlign: 'center' },
  grid: { gap: 4 },
  weekRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  dayText: { fontSize: fontSize.base },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', marginBottom: 2 },
  detailDate: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold },
  detailMeta: { fontSize: fontSize.sm },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  rowMeta: { fontSize: fontSize.xs, marginTop: 2 },
  emptyPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold },
  emptyDesc: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
});
