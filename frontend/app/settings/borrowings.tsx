import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBorrowingStore } from '../../stores/borrowingStore';
import { useItemStore } from '../../stores/itemStore';
import { appDesign, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { BorrowingCard, Button, EmptyState } from '../../components/ui';
import { showAlert } from '../../lib/alert';
import { SwipeableRow } from '../../components/SwipeableRow';

type TabType = 'all' | 'borrowed' | 'returned' | 'overdue';

export default function BorrowingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { borrowings, fetchBorrowings, fetchByItemId, returnBorrowing, deleteBorrowing } = useBorrowingStore();
  const { fetchItems } = useItemStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.itemId) {
      fetchByItemId(params.itemId);
    } else {
      fetchBorrowings();
    }
    fetchItems();
  }, [params.itemId]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (params.itemId) {
      await fetchByItemId(params.itemId);
    } else {
      await fetchBorrowings();
    }
    setRefreshing(false);
  };

  const handleReturn = async (id: string) => {
    showAlert('确认归还', '确认标记此物品为已归还？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认归还',
        onPress: async () => {
          await returnBorrowing(id);
          if (params.itemId) {
            await fetchByItemId(params.itemId);
          } else {
            await fetchBorrowings();
          }
        },
      },
    ]);
  };

  const handleDelete = (id: string) => {
    showAlert('确认删除', '删除后将无法恢复该借用记录。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteBorrowing(id);
          if (params.itemId) {
            await fetchByItemId(params.itemId);
          } else {
            await fetchBorrowings();
          }
        },
      },
    ]);
  };

  const filteredBorrowings = borrowings.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'borrowed', label: '借出中', count: borrowings.filter((b) => b.status === 'borrowed').length },
    { key: 'overdue', label: '已逾期', count: borrowings.filter((b) => b.status === 'overdue').length },
    { key: 'returned', label: '已归还', count: borrowings.filter((b) => b.status === 'returned').length },
    { key: 'all', label: '全部', count: borrowings.length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        style={{ backgroundColor: palette.bg }}
        contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
        >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: palette.text }]}>借用管理</Text>
            </View>
            <View style={[styles.summaryStack, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.summaryValue, { color: palette.text }]}>{borrowings.length}</Text>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>条记录</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.textMuted }]}>借出中</Text>
              <Text style={[styles.metricValue, { color: palette.warning }]}>
                {borrowings.filter((b) => b.status === 'borrowed').length}
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.textMuted }]}>已逾期</Text>
              <Text style={[styles.metricValue, { color: palette.danger }]}>
                {borrowings.filter((b) => b.status === 'overdue').length}
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.textMuted }]}>已归还</Text>
              <Text style={[styles.metricValue, { color: palette.success }]}>
                {borrowings.filter((b) => b.status === 'returned').length}
              </Text>
            </View>
          </View>
          {!params.itemId && (
            <View style={[styles.filterTabs, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterTab, activeTab === tab.key && { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.filterText, { color: palette.textMuted }, activeTab === tab.key && { color: palette.text }]}>
                    {tab.label}
                  </Text>
                  <Text style={[styles.filterCount, { color: activeTab === tab.key ? palette.orange : palette.textMuted }]}>
                    {tab.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {filteredBorrowings.length === 0 ? (
          <EmptyState
            icon="package-variant"
            title="暂无借用记录"
            description={params.itemId ? '该物品暂无借用历史' : '点击右下角添加借用记录'}
            actionLabel={params.itemId ? '刷新记录' : '新增借用'}
            buttonVariant="secondary"
            onAction={() => {
              if (params.itemId) {
                onRefresh();
                return;
              }
              router.push('/settings/borrowing-create');
            }}
          />
        ) : (
          filteredBorrowings.map((borrowing) => (
            <SwipeableRow key={borrowing.id} onDelete={() => handleDelete(borrowing.id)}>
              <BorrowingCard
                borrowing={borrowing}
                onPress={() => router.push(`/item/${borrowing.item_id}`)}
                onReturn={borrowing.status !== 'returned' ? () => handleReturn(borrowing.id) : undefined}
              />
            </SwipeableRow>
          ))
        )}
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
        <Button
          title="新增借用"
          onPress={() => router.push('/settings/borrowing-create')}
          variant="primary"
          icon={<MaterialCommunityIcons name="plus-circle" size={16} color="#FFFFFF" style={styles.actionIcon} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryStack: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  metricCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    gap: spacing.xs,
  },
  filterTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  filterCount: {
    fontSize: fontSize.xs,
  },
  actionBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionIcon: {
    marginRight: 6,
  },
});
