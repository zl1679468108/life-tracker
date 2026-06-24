import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useItemStore } from '../../stores/itemStore';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Period = 'week' | 'month' | 'year';

// 生成颜色
const CHART_COLORS = ['#FF6B35', '#7C5CFC', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function StatsScreen() {
  const { items, fetchItems } = useItemStore();
  const { todos, fetchTodos } = useTodoStore();
  const { categories, fetchCategories } = useCategoryStore();
  const colors = useColors();
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    fetchItems();
    fetchTodos();
    fetchCategories();
  }, []);

  // 计算待办统计
  const pendingTodos = todos.filter((t) => !t.completed).length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // 分类 ID 到名称的映射
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // 计算物品分类统计
  const categoryCount: Record<string, number> = {};
  items.forEach((item) => {
    const cat = item.category_id || 'uncategorized';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const totalItems = items.length;

  // 计算趋势数据
  const getTrendData = useMemo(() => {
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (period === 'week') {
      // 最近 7 天
      labels = ['一', '二', '三', '四', '五', '六', '日'];
      data = [0, 0, 0, 0, 0, 0, 0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      todos
        .filter((t) => t.completed && new Date(t.updated_at) >= weekAgo)
        .forEach((t) => {
          const day = new Date(t.updated_at).getDay();
          // getDay(): 0=周日, 1=周一... 转为 0=周一, 6=周日
          const idx = day === 0 ? 6 : day - 1;
          data[idx]++;
        });
    } else if (period === 'month') {
      // 最近 4 周
      labels = ['第1周', '第2周', '第3周', '第4周'];
      data = [0, 0, 0, 0];
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      todos
        .filter((t) => t.completed && new Date(t.updated_at) >= monthAgo)
        .forEach((t) => {
          const diff = now.getTime() - new Date(t.updated_at).getTime();
          const weekIndex = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
          if (weekIndex < 4) {
            data[3 - weekIndex]++;
          }
        });
    } else {
      // 最近 12 个月
      labels = [];
      data = [];
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthNames[d.getMonth()]);
        data.push(0);
      }
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      todos
        .filter((t) => t.completed && new Date(t.updated_at) >= yearAgo)
        .forEach((t) => {
          const tDate = new Date(t.updated_at);
          const monthDiff = (now.getFullYear() - tDate.getFullYear()) * 12 + (now.getMonth() - tDate.getMonth());
          if (monthDiff >= 0 && monthDiff < 12) {
            data[11 - monthDiff]++;
          }
        });
    }

    return { labels, data };
  }, [todos, period]);

  // 饼图数据
  const pieData = Object.entries(categoryCount).map(([catId, count], index) => ({
    name: categoryMap[catId] || (catId === 'uncategorized' ? '未分类' : catId),
    population: count,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: colors.gray[500],
    legendFontSize: 12,
  }));

  // 柱状图数据（按分类）
  const barLabels = Object.keys(categoryCount).slice(0, 6).map((catId) => {
    const name = categoryMap[catId] || (catId === 'uncategorized' ? '未分类' : catId);
    return name.length > 4 ? name.slice(0, 4) : name;
  });
  const barData = Object.values(categoryCount).slice(0, 6);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      {/* 周期选择 */}
      <View style={[styles.periodBar, { backgroundColor: colors.gray[100] }]}>
        {([
          { key: 'week', label: '本周' },
          { key: 'month', label: '本月' },
          { key: 'year', label: '本年' },
        ] as { key: Period; label: string }[]).map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive, period === p.key && { backgroundColor: colors.white }]}
            onPress={() => setPeriod(p.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodText, { color: colors.gray[500] }, period === p.key && styles.periodTextActive, period === p.key && { color: colors.gray[900] }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsGrid}>
        <View style={[styles.statsMiniCard, { backgroundColor: colors.white }]}>
          <Text style={[styles.statsLabel, { color: colors.gray[500] }]}>物品总数</Text>
          <Text style={[styles.statsValue, { color: colors.gray[900] }]}>{totalItems}</Text>
        </View>
        <View style={[styles.statsMiniCard, { backgroundColor: colors.white }]}>
          <Text style={[styles.statsLabel, { color: colors.gray[500] }]}>完成待办</Text>
          <Text style={[styles.statsValue, { color: colors.gray[900] }]}>{completedTodos}</Text>
        </View>
        <View style={[styles.statsMiniCard, { backgroundColor: colors.white }]}>
          <Text style={[styles.statsLabel, { color: colors.gray[500] }]}>完成率</Text>
          <Text style={[styles.statsValue, { color: colors.gray[900] }]}>{completionRate}%</Text>
        </View>
        <View style={[styles.statsMiniCard, { backgroundColor: colors.white }]}>
          <Text style={[styles.statsLabel, { color: colors.gray[500] }]}>待完成</Text>
          <Text style={[styles.statsValue, { color: colors.gray[900] }]}>{pendingTodos}</Text>
        </View>
      </View>

      {/* 待办完成趋势 */}
      <View style={[styles.chartCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.chartTitle, { color: colors.gray[900] }]}>待办完成趋势</Text>
        <View style={styles.chartContainer}>
          {trendData.data.some((v) => v > 0) ? (
            <LineChart
              data={{
                labels: trendData.labels,
                datasets: [{ data: trendData.data }],
              }}
              width={SCREEN_WIDTH - 64}
              height={200}
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
                labelColor: () => colors.gray[500],
                style: { borderRadius: 12 },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{ borderRadius: 12 }}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.gray[400] }]}>暂无数据</Text>
          )}
        </View>
      </View>

      {/* 物品分类分布 */}
      <View style={[styles.chartCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.chartTitle, { color: colors.gray[900] }]}>物品分类分布</Text>
        <View style={styles.chartContainer}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - 64}
              height={220}
              chartConfig={{
                color: () => colors.gray[900],
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.gray[400] }]}>暂无数据</Text>
          )}
        </View>
      </View>

      {/* 物品数量统计 */}
      <View style={[styles.chartCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.chartTitle, { color: colors.gray[900] }]}>物品数量统计</Text>
        <View style={styles.chartContainer}>
          {barData.length > 0 ? (
            <BarChart
              data={{
                labels: barLabels,
                datasets: [{ data: barData }],
              }}
              width={SCREEN_WIDTH - 64}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
                labelColor: () => colors.gray[500],
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 12 }}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.gray[400] }]}>暂无数据</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  periodBar: { flexDirection: 'row', borderRadius: borderRadius.md, padding: 4, margin: spacing.xl },
  periodBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.sm },
  periodBtnActive: { ...shadows.sm },
  periodText: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  periodTextActive: {},
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  statsMiniCard: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  statsLabel: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  statsValue: { fontSize: fontSize['7xl'], fontWeight: fontWeight.bold },
  chartCard: { marginHorizontal: spacing.xl, borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.sm },
  chartTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.xl },
  chartContainer: { minHeight: 160, alignItems: 'center' },
  emptyText: { fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing['3xl'] },
});
