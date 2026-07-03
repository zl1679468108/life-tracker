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
  const { items, fetchItems } = useItemStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const itemContextId = params.itemId;
  const contextItem = itemContextId ? items.find((item) => item.id === itemContextId) : undefined;
  const goCreateBorrowing = () => {
    router.push({
      pathname: '/settings/borrowing-create',
      params: itemContextId ? { itemId: itemContextId } : {},
    });
  };

  useEffect(() => {
    if (itemContextId) {
      fetchByItemId(itemContextId);
    } else {
      fetchBorrowings();
    }
    fetchItems();
  }, [itemContextId]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (itemContextId) {
      await fetchByItemId(itemContextId);
    } else {
      await fetchBorrowings();
    }
    await fetchItems();
    setRefreshing(false);
  };

  const handleReturn = async (id: string) => {
    showAlert('确认归还', '确认标记此物品为已归还？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认归还',
        onPress: async () => {
          await returnBorrowing(id);
          if (itemContextId) {
            await fetchByItemId(itemContextId);
          } else {
            await fetchBorrowings();
          }
          await fetchItems();
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
          if (itemContextId) {
            await fetchByItemId(itemContextId);
          } else {
            await fetchBorrowings();
          }
          await fetchItems();
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
          </View>
          {itemContextId && (
            <View style={[styles.contextCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={[styles.contextIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="package-variant" size={18} color={palette.orange} />
              </View>
              <View style={styles.contextCopy}>
                <Text style={[styles.contextTitle, { color: palette.text }]} numberOfLines={1}>
                  {contextItem?.name || '当前物品'}
                </Text>
                <Text style={[styles.contextMeta, { color: palette.textMuted }]}>
                  {borrowings.length} 条记录 · {borrowings.some((b) => b.status !== 'returned') ? '借出中' : '当前可借出'}
                </Text>
              </View>
            </View>
          )}
          {!itemContextId && (
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
            description={itemContextId ? '该物品暂无借用历史，可直接发起借出' : '点击右下角添加借用记录'}
            actionLabel="新增借用"
            buttonVariant="secondary"
            onAction={goCreateBorrowing}
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
          onPress={goCreateBorrowing}
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
    marginBottom: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  contextIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextCopy: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  contextMeta: {
    fontSize: fontSize.sm,
    marginTop: 2,
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
