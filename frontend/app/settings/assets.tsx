import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { api } from '../../lib/api';
import type { TotalValueResponse } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_COLORS = ['#FF6B35', '#7C5CFC', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AssetsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<TotalValueResponse | null>(null);

  useEffect(() => {
    fetchTotalValue();
  }, []);

  const fetchTotalValue = async () => {
    setLoading(true);
    const res = await api.itemsValue.total();
    if (res.data) setTotalValue(res.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pieData = (totalValue?.by_category || []).map((cat, index) => ({
    name: cat.category_name,
    population: cat.total_value,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: colors.gray[500],
    legendFontSize: 12,
  }));

  const depreciationRate = totalValue && totalValue.total_purchase_price > 0
    ? Math.round((totalValue.total_depreciation / totalValue.total_purchase_price) * 100)
    : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      {/* 总资产卡片 */}
      <View style={[styles.totalCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.totalLabel, { color: colors.gray[500] }]}>资产总价值</Text>
        <Text style={[styles.totalValue, { color: colors.gray[900] }]}>
          ¥{(totalValue?.total_current_value || 0).toLocaleString()}
        </Text>
        <View style={styles.totalRow}>
          <View style={styles.totalItem}>
            <Text style={[styles.totalItemLabel, { color: colors.gray[400] }]}>购买总价</Text>
            <Text style={[styles.totalItemValue, { color: colors.success }]}>
              ¥{(totalValue?.total_purchase_price || 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: colors.gray[200] }]} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalItemLabel, { color: colors.gray[400] }]}>总折旧</Text>
            <Text style={[styles.totalItemValue, { color: colors.danger }]}>
              -¥{(totalValue?.total_depreciation || 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: colors.gray[200] }]} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalItemLabel, { color: colors.gray[400] }]}>折旧率</Text>
            <Text style={[styles.totalItemValue, { color: colors.warning }]}>{depreciationRate}%</Text>
          </View>
        </View>
      </View>

      {/* 分类分布饼图 */}
      {pieData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.white }]}>
          <Text style={[styles.chartTitle, { color: colors.gray[900] }]}>资产分类分布</Text>
          <PieChart
            data={pieData}
            width={SCREEN_WIDTH - 64}
            height={220}
            chartConfig={{ color: () => colors.gray[900] }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
        </View>
      )}

      {/* 分类明细列表 */}
      <View style={[styles.listCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.chartTitle, { color: colors.gray[900] }]}>分类资产明细</Text>
        {(totalValue?.by_category || []).map((cat, index) => (
          <View key={cat.category_id} style={[styles.listItem, { borderBottomColor: colors.gray[100] }]}>
            <View style={[styles.listDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
            <Text style={[styles.listName, { color: colors.gray[800] }]}>{cat.category_name}</Text>
            <Text style={[styles.listValue, { color: colors.gray[900] }]}>¥{cat.total_value.toLocaleString()}</Text>
          </View>
        ))}
        {(!totalValue?.by_category || totalValue.by_category.length === 0) && (
          <Text style={[styles.emptyText, { color: colors.gray[400] }]}>暂无资产数据</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  totalCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  totalLabel: { fontSize: fontSize.base, marginBottom: spacing.xs },
  totalValue: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, marginBottom: spacing.lg },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
  totalItem: { flex: 1, alignItems: 'center' },
  totalItemLabel: { fontSize: fontSize.xs, marginBottom: 2 },
  totalItemValue: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  totalDivider: { width: 1, height: 30, marginHorizontal: spacing.sm },
  chartCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
    alignItems: 'center',
  },
  chartTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.lg },
  listCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  listDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  listName: { flex: 1, fontSize: fontSize.base },
  listValue: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  emptyText: { fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.xl },
});
