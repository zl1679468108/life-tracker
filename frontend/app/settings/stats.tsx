import React, { useEffect, useMemo } from 'react';
import { AppScreen } from '../../components/ui';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';
import type { LifeTodo } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_COLORS = ['#F36F3C', '#7C5CFC', '#10A66E', '#D89400', '#3B82F6', '#E84A5F'];
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getTodoTime(todo: LifeTodo) {
  const raw = todo.due_date || todo.reminder_date;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

function formatDueLabel(todo: LifeTodo) {
  const time = getTodoTime(todo);
  if (!time) return '未设置截止时间';
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(time));
  const diff = Math.round((target - today) / DAY_MS);
  if (diff === 0) return '今天截止';
  if (diff === -1) return '昨天截止';
  if (diff < 0) return `已逾期 ${Math.abs(diff)} 天`;
  if (diff === 1) return '明天截止';
  return `${diff} 天后截止`;
}

export default function StatsScreen() {
  const colors = useColors();
  const palette = usePalette();
  const { items, fetchItems } = useItemStore();
  const { todos, fetchTodos } = useTodoStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchItems();
    fetchTodos();
    fetchCategories();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const today = startOfDay(new Date());
    const weekAgo = now - 7 * DAY_MS;
    const pendingTodos = todos.filter((todo) => !todo.completed);
    const completedTodos = todos.filter((todo) => todo.completed);
    const overdueTodos = pendingTodos
      .filter((todo) => {
        const time = getTodoTime(todo);
        return time !== null && startOfDay(new Date(time)) < today;
      })
      .sort((a, b) => (getTodoTime(a) || 0) - (getTodoTime(b) || 0));
    const dueTodayTodos = pendingTodos.filter((todo) => {
      const time = getTodoTime(todo);
      return time !== null && startOfDay(new Date(time)) === today;
    });
    const recentCompleted = completedTodos.filter((todo) => {
      const updatedAt = new Date(todo.updated_at).getTime();
      return !Number.isNaN(updatedAt) && updatedAt >= weekAgo;
    }).length;
    const completionRate = todos.length ? Math.round((completedTodos.length / todos.length) * 100) : 0;

    return {
      pendingTodos,
      completedTodos,
      overdueTodos,
      dueTodayTodos,
      recentCompleted,
      completionRate,
    };
  }, [todos]);

  const categoryRows = useMemo(() => {
    const categoryMap: Record<string, string> = {};
    categories.forEach((category) => {
      categoryMap[category.id] = category.name;
    });

    const categoryCount: Record<string, number> = {};
    items.forEach((item) => {
      const categoryId = item.category_id || 'uncategorized';
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([categoryId, count], index) => ({
        id: categoryId,
        name: categoryMap[categoryId] || (categoryId === 'uncategorized' ? '未分类' : categoryId),
        count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [categories, items]);

  const topCategory = categoryRows[0];
  const maxCategoryCount = Math.max(...categoryRows.map((row) => row.count), 1);
  const nextAction =
    stats.overdueTodos.length > 0
      ? `先处理 ${stats.overdueTodos.length} 个逾期待办`
      : stats.dueTodayTodos.length > 0
        ? `今天还有 ${stats.dueTodayTodos.length} 个待办`
        : stats.pendingTodos.length > 0
          ? '待办节奏正常'
          : '待办已清空';

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroLabel, { color: palette.textSecondary }]}>待办完成率</Text>
            <Text style={[styles.heroValue, { color: palette.text }]}>{stats.completionRate}%</Text>
          </View>
          <View style={[styles.heroChip, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons
              name={stats.overdueTodos.length ? 'alert-circle-outline' : 'check-circle-outline'}
              size={16}
              color={stats.overdueTodos.length ? palette.danger : palette.success}
            />
            <Text style={[styles.heroChipText, { color: stats.overdueTodos.length ? palette.danger : palette.success }]}>
              {nextAction}
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: palette.surfaceSoft }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${stats.completionRate}%`,
                backgroundColor: stats.completionRate >= 80 ? palette.success : stats.completionRate >= 50 ? palette.orange : palette.warning,
              },
            ]}
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="待完成" value={stats.pendingTodos.length} icon="clock-outline" tone={palette.warning} palette={palette} />
          <MetricCard label="已完成" value={stats.completedTodos.length} icon="check-circle-outline" tone={palette.success} palette={palette} />
          <MetricCard label="近 7 天完成" value={stats.recentCompleted} icon="calendar-check-outline" tone={palette.orange} palette={palette} />
          <MetricCard label="物品总数" value={items.length} icon="package-variant-closed" tone={palette.violet} palette={palette} />
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>行动摘要</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>近期逾期待办</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: stats.overdueTodos.length ? palette.danger : palette.textMuted }]}>
            {stats.overdueTodos.length ? `${stats.overdueTodos.length} 个` : '无逾期'}
          </Text>
        </View>

        {stats.overdueTodos.length ? (
          <View style={styles.actionList}>
            {stats.overdueTodos.slice(0, 4).map((todo) => (
              <View key={todo.id} style={[styles.todoRow, { borderColor: palette.border }]}>
                <View style={[styles.todoIcon, { backgroundColor: `${palette.danger}16` }]}>
                  <MaterialCommunityIcons name="alert-outline" size={18} color={palette.danger} />
                </View>
                <View style={styles.todoCopy}>
                  <Text style={[styles.todoTitle, { color: palette.text }]} numberOfLines={1}>
                    {todo.title}
                  </Text>
                  <Text style={[styles.todoMeta, { color: palette.textMuted }]}>{formatDueLabel(todo)}</Text>
                </View>
                <Text style={[styles.priorityText, { color: palette.danger }]}>P{todo.priority}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyPanel palette={palette} icon="check-circle-outline" title="没有逾期待办" desc="当前待办节奏健康，继续保持今天的处理进度。" />
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>物品摘要</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>物品分类分布</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>
            {topCategory ? `最多：${topCategory.name}` : '暂无分类'}
          </Text>
        </View>

        {categoryRows.length ? (
          <View style={styles.categoryList}>
            {categoryRows.slice(0, 6).map((row) => {
              const percent = items.length ? Math.round((row.count / items.length) * 100) : 0;
              const width = `${Math.max(8, Math.round((row.count / maxCategoryCount) * 100))}%` as `${number}%`;
              return (
                <View key={row.id} style={styles.categoryRow}>
                  <View style={styles.categoryTop}>
                    <View style={styles.categoryNameWrap}>
                      <View style={[styles.categoryDot, { backgroundColor: row.color }]} />
                      <Text style={[styles.categoryName, { color: palette.text }]} numberOfLines={1}>
                        {row.name}
                      </Text>
                    </View>
                    <Text style={[styles.categoryValue, { color: palette.textMuted }]}>
                      {row.count} 件 · {percent}%
                    </Text>
                  </View>
                  <View style={[styles.categoryTrack, { backgroundColor: palette.surfaceSoft }]}>
                    <View style={[styles.categoryFill, { width, backgroundColor: row.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyPanel palette={palette} icon="chart-donut" title="暂无分类数据" desc="添加物品并选择分类后，这里会显示最常用的物品分类。" />
        )}
      </View>
    </AppScreen>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
  palette,
}: {
  label: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: string;
  palette: typeof appDesign.light;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: `${tone}16` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={tone} />
      </View>
      <Text style={[styles.metricValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: palette.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function EmptyPanel({
  palette,
  icon,
  title,
  desc,
}: {
  palette: typeof appDesign.light;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  desc: string;
}) {
  return (
    <View style={[styles.emptyPanel, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
      <MaterialCommunityIcons name={icon} size={24} color={palette.textMuted} />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>{desc}</Text>
    </View>
  );
}

const metricWidth = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, marginBottom: spacing.xs },
  heroValue: { fontSize: 52, lineHeight: 58, fontWeight: fontWeight.bold },
  heroChip: {
    flexShrink: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroChipText: { flexShrink: 1, fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: metricWidth,
    minHeight: 88,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginBottom: 2 },
  metricLabel: { fontSize: fontSize.sm },
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', marginBottom: 2 },
  sectionTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold },
  sectionMeta: { flexShrink: 1, fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, textAlign: 'right' },
  actionList: { gap: spacing.sm },
  todoRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  todoIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  todoCopy: { flex: 1, minWidth: 0 },
  todoTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold, marginBottom: 2 },
  todoMeta: { fontSize: fontSize.sm },
  priorityText: { marginLeft: spacing.md, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  categoryList: { gap: spacing.md },
  categoryRow: { gap: spacing.sm },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  categoryNameWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  categoryName: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  categoryValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  categoryTrack: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  categoryFill: { height: '100%', borderRadius: borderRadius.full },
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
