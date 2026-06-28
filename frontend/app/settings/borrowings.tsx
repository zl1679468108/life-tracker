import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBorrowingStore } from '../../stores/borrowingStore';
import { useItemStore } from '../../stores/itemStore';
import { spacing, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { BorrowingCard, Button, EmptyState } from '../../components/ui';
import { showAlert } from '../../lib/alert';
import { SwipeableRow } from '../../components/SwipeableRow';

type TabType = 'all' | 'borrowed' | 'returned' | 'overdue';

export default function BorrowingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const colors = useColors();
  const { borrowings, fetchBorrowings, fetchByItemId, returnBorrowing, deleteBorrowing } = useBorrowingStore();
  const { fetchItems } = useItemStore();
  const [activeTab, setActiveTab] = useState<TabType>(params.itemId ? 'all' : 'borrowed');
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
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      {!params.itemId && (
        <View style={[styles.tabBar, { backgroundColor: colors.white }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.gray[500] },
                  activeTab === tab.key && { color: colors.primary, fontWeight: fontWeight.semiBold },
                ]}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        style={{ backgroundColor: colors.gray[50] }}
        contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {filteredBorrowings.length === 0 ? (
          <EmptyState
            icon="package-variant"
            title="暂无借用记录"
            description={params.itemId ? '该物品暂无借用历史' : '点击右下角添加借用记录'}
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

      <View style={styles.fab}>
        <Button
          title="新增借用"
          onPress={() => router.push('/settings/borrowing-create')}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: fontSize.base,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
});
