import React, { useEffect, useMemo, useState } from 'react';
import { AppScreen } from '../../components/ui';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import type { TotalValueResponse } from '../../types';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_COLORS = ['#F36F3C', '#7C5CFC', '#10A66E', '#D89400', '#3B82F6', '#E84A5F', '#8B5CF6', '#06B6D4'];
const currencySymbol = (currency?: string) => (currency === 'CNY' || !currency ? '¥' : `${currency} `);
const formatMoney = (value: number | undefined, currency?: string) =>
  `${currencySymbol(currency)}${Math.round(value || 0).toLocaleString()}`;
const formatDelta = (value: number, currency?: string) => {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${prefix}${formatMoney(Math.abs(value), currency)}`;
};

export default function AssetsScreen() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<TotalValueResponse | null>(null);

  useEffect(() => {
    void fetchTotalValue();
  }, []);

  const fetchTotalValue = async () => {
    setLoading(true);
    const res = await api.itemsValue.total();
    if (res.data) {
      setTotalValue(res.data);
    }
    setLoading(false);
  };

  const categoryRows = totalValue?.by_category || [];
  const recentChanges = totalValue?.recent_changes || [];
  const hasCategoryData = categoryRows.length > 0;
  const displayCurrency = totalValue?.currency || 'CNY';
  const depreciationRate =
    totalValue && totalValue.total_purchase_price > 0
      ? Math.round((totalValue.total_depreciation / totalValue.total_purchase_price) * 100)
      : 0;

  const topCategory = useMemo(() => {
    if (!categoryRows.length) return null;
    return [...categoryRows].sort((a, b) => b.total_value - a.total_value)[0];
  }, [categoryRows]);

  const pieData = categoryRows.map((cat, index) => ({
    name: cat.category_name,
    population: cat.total_value,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: palette.textMuted,
    legendFontSize: 12,
  }));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.orange} />
      </View>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: palette.textSecondary }]}>资产总价值</Text>
            <Text style={[styles.heroValue, { color: palette.text }]}>
              {formatMoney(totalValue?.total_current_value, displayCurrency)}
            </Text>
          </View>
          <View style={[styles.heroChip, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="chart-donut" size={16} color={palette.orange} />
            <Text style={[styles.heroChipText, { color: palette.orange }]}>
              {topCategory ? `最高占比 ${topCategory.category_name}` : '等待资产数据'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.metricLabel, { color: palette.textMuted }]}>购买总价</Text>
            <Text style={[styles.metricValue, { color: palette.success }]}>
              {formatMoney(totalValue?.total_purchase_price, displayCurrency)}
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.metricLabel, { color: palette.textMuted }]}>总折旧</Text>
            <Text style={[styles.metricValue, { color: palette.danger }]}>
              -{formatMoney(totalValue?.total_depreciation, displayCurrency)}
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.metricLabel, { color: palette.textMuted }]}>折旧率</Text>
            <Text style={[styles.metricValue, { color: palette.warning }]}>{depreciationRate}%</Text>
          </View>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>分类图表</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>资产分类分布</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>
            {hasCategoryData ? `${categoryRows.length} 个分类` : '暂无分类数据'}
          </Text>
        </View>

        {hasCategoryData ? (
          <View style={styles.chartWrap}>
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - 64}
              height={220}
              chartConfig={{ color: () => palette.text }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="8"
              absolute={false}
            />
          </View>
        ) : (
          <View style={[styles.emptyPanel, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="chart-donut-variant" size={24} color={palette.textMuted} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>暂无资产数据</Text>
            <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>添加带价值信息的物品后，这里会自动生成分类占比。</Text>
          </View>
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>分类明细</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>分类资产明细</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>按当前估值降序</Text>
        </View>

        {hasCategoryData ? (
          <View style={styles.detailList}>
            {[...categoryRows]
              .sort((a, b) => b.total_value - a.total_value)
              .map((cat, index) => {
                const percent = totalValue?.total_current_value
                  ? Math.round((cat.total_value / totalValue.total_current_value) * 100)
                  : 0;
                return (
                  <View key={cat.category_id} style={[styles.detailRow, { borderColor: palette.border }]}>
                    <View style={[styles.detailDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                    <View style={styles.detailCopy}>
                      <Text style={[styles.detailName, { color: palette.text }]} numberOfLines={1}>
                        {cat.category_name}
                      </Text>
                      <Text style={[styles.detailMeta, { color: palette.textMuted }]}>{percent}% 占比</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: palette.text }]}>
                      {formatMoney(cat.total_value, displayCurrency)}
                    </Text>
                  </View>
                );
              })}
          </View>
        ) : (
          <Text style={[styles.emptyInline, { color: palette.textMuted }]}>当前没有可展示的资产分类明细。</Text>
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>价值变化</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>最近价值变化</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>
            {recentChanges.length ? `${recentChanges.length} 条` : '暂无变化'}
          </Text>
        </View>

        {recentChanges.length ? (
          <View style={styles.detailList}>
            {recentChanges.map((change) => {
              const isPositive = (change.delta || 0) > 0;
              const isNegative = (change.delta || 0) < 0;
              const deltaLabel = change.delta == null ? '首次记录' : formatDelta(change.delta, displayCurrency);
              return (
                <View key={`${change.item_id}-${change.recorded_at}`} style={[styles.detailRow, { borderColor: palette.border }]}>
                  <MaterialCommunityIcons
                    name={change.delta == null ? 'bookmark-plus-outline' : isPositive ? 'trending-up' : isNegative ? 'trending-down' : 'minus'}
                    size={18}
                    color={change.delta == null ? palette.orange : isPositive ? palette.success : isNegative ? palette.danger : palette.textMuted}
                    style={styles.changeIcon}
                  />
                  <View style={styles.detailCopy}>
                    <Text style={[styles.detailName, { color: palette.text }]} numberOfLines={1}>
                      {change.item_name}
                    </Text>
                    <Text style={[styles.detailMeta, { color: palette.textMuted }]}>
                      {new Date(change.recorded_at).toLocaleDateString('zh-CN')} · {change.reason || '估值更新'}
                    </Text>
                  </View>
                  <View style={styles.changeValueBlock}>
                    <Text style={[styles.detailValue, { color: palette.text }]}>
                      {formatMoney(change.value, displayCurrency)}
                    </Text>
                    <Text style={[styles.changeDelta, { color: isPositive ? palette.success : isNegative ? palette.danger : palette.textMuted }]}>
                      {deltaLabel}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyInline, { color: palette.textMuted }]}>编辑物品当前估值后，这里会显示最近变化。</Text>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 220,
  },
  heroChipText: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
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
  sectionEyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semiBold,
  },
  sectionMeta: {
    fontSize: fontSize.sm,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  emptyPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailList: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  detailDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  detailMeta: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginLeft: spacing.md,
  },
  changeIcon: {
    marginRight: spacing.md,
  },
  changeValueBlock: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  changeDelta: {
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: fontWeight.medium,
  },
  emptyInline: {
    fontSize: fontSize.sm,
    paddingVertical: spacing.sm,
  },
});
