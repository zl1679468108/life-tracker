import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useItemStore } from '../../stores/itemStore';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type Period = 'week' | 'month' | 'year';
const CHART_COLORS = ['#F36F3C', '#7C5CFC', '#10A66E', '#D89400', '#3B82F6', '#E84A5F', '#8B5CF6', '#06B6D4'];

export default function StatsScreen() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { items, fetchItems } = useItemStore();
  const { todos, fetchTodos } = useTodoStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    fetchItems();
    fetchTodos();
    fetchCategories();
  }, []);

  const pendingTodos = todos.filter((t) => !t.completed).length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const totalTodos = todos.length;
  const totalItems = items.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const categoryCount: Record<string, number> = {};
  items.forEach((item) => {
    const categoryId = item.category_id || 'uncategorized';
    categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
  });

  const trendData = useMemo(() => {
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (period === 'week') {
      labels = ['一', '二', '三', '四', '五', '六', '日'];
      data = [0, 0, 0, 0, 0, 0, 0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      todos
        .filter((t) => t.completed && new Date(t.updated_at) >= weekAgo)
        .forEach((t) => {
          const day = new Date(t.updated_at).getDay();
          const idx = day === 0 ? 6 : day - 1;
          data[idx] += 1;
        });
    } else if (period === 'month') {
      labels = ['第1周', '第2周', '第3周', '第4周'];
      data = [0, 0, 0, 0];
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      todos
        .filter((t) => t.completed && new Date(t.updated_at) >= monthAgo)
        .forEach((t) => {
          const diff = now.getTime() - new Date(t.updated_at).getTime();
          const weekIndex = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
          if (weekIndex < 4) {
            data[3 - weekIndex] += 1;
          }
        });
    } else {
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      labels = [];
      data = [];
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthNames[d.getMonth()]);
        data.push(0);
      }
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      todos
        .filter((t) => t.completed && new Date(t.updated_at) >= yearAgo)
        .forEach((t) => {
          const doneAt = new Date(t.updated_at);
          const monthDiff = (now.getFullYear() - doneAt.getFullYear()) * 12 + (now.getMonth() - doneAt.getMonth());
          if (monthDiff >= 0 && monthDiff < 12) {
            data[11 - monthDiff] += 1;
          }
        });
    }

    return { labels, data };
  }, [period, todos]);

  const pieData = Object.entries(categoryCount).map(([categoryId, count], index) => ({
    name: categoryMap[categoryId] || (categoryId === 'uncategorized' ? '未分类' : categoryId),
    population: count,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: palette.textMuted,
    legendFontSize: 12,
  }));

  const sortedCategoryEntries = Object.entries(categoryCount)
    .map(([categoryId, count]) => ({
      id: categoryId,
      name: categoryMap[categoryId] || (categoryId === 'uncategorized' ? '未分类' : categoryId),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const barLabels = sortedCategoryEntries.slice(0, 5).map((entry) => (entry.name.length > 4 ? entry.name.slice(0, 4) : entry.name));
  const barData = sortedCategoryEntries.slice(0, 5).map((entry) => entry.count);

  const periodOptions: Array<{ key: Period; label: string }> = [
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'year', label: '本年' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>数据与提醒</Text>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>数据统计</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              回顾待办完成节奏和物品分布，帮助你快速判断近期记录密度与重点分类。
            </Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.summaryValue, { color: palette.text }]}>{completionRate}%</Text>
            <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>完成率</Text>
          </View>
        </View>
      </View>

      <View style={[styles.periodBar, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.periodBtn,
              period === option.key && { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => setPeriod(option.key)}
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === option.key ? palette.text : palette.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metricsGrid}>
        {[
          { label: '物品总数', value: totalItems, tone: palette.orange, icon: 'package-variant-closed' },
          { label: '完成待办', value: completedTodos, tone: palette.success, icon: 'check-circle-outline' },
          { label: '待完成', value: pendingTodos, tone: palette.warning, icon: 'clock-outline' },
          { label: '总待办', value: totalTodos, tone: palette.violet, icon: 'format-list-checks' },
        ].map((metric) => (
          <View key={metric.label} style={[styles.metricCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <MaterialCommunityIcons name={metric.icon as any} size={18} color={metric.tone} />
            </View>
            <Text style={[styles.metricLabel, { color: palette.textMuted }]}>{metric.label}</Text>
            <Text style={[styles.metricValue, { color: palette.text }]}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>趋势图表</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>待办完成趋势</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>
            {period === 'week' ? '最近 7 天' : period === 'month' ? '最近 4 周' : '最近 12 个月'}
          </Text>
        </View>

        {trendData.data.some((value) => value > 0) ? (
          <View style={styles.chartWrap}>
            <LineChart
              data={{ labels: trendData.labels, datasets: [{ data: trendData.data }] }}
              width={SCREEN_WIDTH - 64}
              height={220}
              chartConfig={{
                backgroundColor: palette.surface,
                backgroundGradientFrom: palette.surface,
                backgroundGradientTo: palette.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(243, 111, 60, ${opacity})`,
                labelColor: () => palette.textMuted,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: palette.orange,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        ) : (
          <EmptyPanel palette={palette} icon="chart-line" title="暂无数据" desc="完成待办后，这里会显示当前时间维度下的完成趋势。" />
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>分类图表</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>物品分类分布</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>{pieData.length} 个分类</Text>
        </View>

        {pieData.length > 0 ? (
          <View style={styles.chartWrap}>
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - 64}
              height={220}
              chartConfig={{ color: () => palette.text }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="8"
              absolute
            />
          </View>
        ) : (
          <EmptyPanel palette={palette} icon="chart-donut" title="暂无数据" desc="添加物品后，这里会按分类展示数量占比。" />
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>分类排行</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>物品数量统计</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>最多展示前 5 个分类</Text>
        </View>

        {barData.length > 0 ? (
          <>
            <View style={styles.chartWrap}>
              <BarChart
                data={{ labels: barLabels, datasets: [{ data: barData }] }}
                width={SCREEN_WIDTH - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: palette.surface,
                  backgroundGradientFrom: palette.surface,
                  backgroundGradientTo: palette.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(124, 92, 252, ${opacity})`,
                  labelColor: () => palette.textMuted,
                  barPercentage: 0.58,
                }}
                style={styles.chart}
              />
            </View>
            <View style={styles.rankList}>
              {sortedCategoryEntries.slice(0, 5).map((entry, index) => (
                <View key={entry.id} style={[styles.rankRow, { borderColor: palette.border }]}>
                  <View style={[styles.rankDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                  <Text style={[styles.rankName, { color: palette.text }]} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text style={[styles.rankValue, { color: palette.textMuted }]}>{entry.count} 件</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <EmptyPanel palette={palette} icon="chart-bar" title="暂无数据" desc="添加物品后，这里会生成分类数量排行。" />
        )}
      </View>
    </ScrollView>
  );
}

function EmptyPanel({
  palette,
  icon,
  title,
  desc,
}: {
  palette: typeof appDesign.light;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={[styles.emptyPanel, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
      <MaterialCommunityIcons name={icon as any} size={24} color={palette.textMuted} />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  eyebrow: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, marginBottom: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { fontSize: fontSize['5xl'], fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.base, marginTop: spacing.xs },
  summaryBadge: {
    minWidth: 88,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  summaryValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  summaryLabel: { fontSize: fontSize.sm, marginTop: 2 },
  periodBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  periodBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodText: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  metricLabel: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  metricValue: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold },
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
  sectionMeta: { fontSize: fontSize.sm },
  chartWrap: { alignItems: 'center', justifyContent: 'center' },
  chart: { borderRadius: 12 },
  rankList: { gap: spacing.sm, marginTop: spacing.md },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rankDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  rankName: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.medium },
  rankValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },
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
