import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBorrowingStore } from '../../stores/borrowingStore';
import { useItemStore } from '../../stores/itemStore';
import { spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';
import { BorrowingCard, Button, EmptyState, SegmentedTabs, ListSkeleton } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { showAlert } from '../../lib/alert';
import { SwipeableRow } from '../../components/SwipeableRow';

type TabType = 'all' | 'borrowed' | 'returned' | 'overdue';

export default function BorrowingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const colors = useColors();
  const palette = usePalette();
  const { borrowings, fetchBorrowings, fetchByItemId, returnBorrowing, deleteBorrowing } = useBorrowingStore();
  const { items, fetchItems } = useItemStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const itemContextId = params.itemId;
  const contextItem = itemContextId ? items.find((item) => item.id === itemContextId) : undefined;
  const goCreateBorrowing = () => {
    router.push({
      pathname: '/settings/borrowing-create',
      params: itemContextId ? { itemId: itemContextId } : {},
    });
  };

  useEffect(() => {
    const load = async () => {
      if (itemContextId) {
        await fetchByItemId(itemContextId);
      } else {
        await fetchBorrowings();
      }
      await fetchItems();
      setLoading(false);
    };
    load();
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
          try {
            await returnBorrowing(id);
            if (itemContextId) {
              await fetchByItemId(itemContextId);
            } else {
              await fetchBorrowings();
            }
            await fetchItems();
          } catch (error) {
            showAlert('操作失败', error instanceof Error ? error.message : '归还失败');
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
          try {
            await deleteBorrowing(id);
            if (itemContextId) {
              await fetchByItemId(itemContextId);
            } else {
              await fetchBorrowings();
            }
            await fetchItems();
          } catch (error) {
            showAlert('操作失败', error instanceof Error ? error.message : '删除失败');
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
    <SafeScreen backgroundColor={palette.bg}>
      <FlatList
        style={{ backgroundColor: palette.bg }}
        contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
        data={filteredBorrowings}
        keyExtractor={(item) => item.id}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item.id)}>
            <BorrowingCard
              borrowing={item}
              onPress={() => router.push(`/item/${item.item_id}`)}
              onReturn={item.status !== 'returned' ? () => handleReturn(item.id) : undefined}
            />
          </SwipeableRow>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
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
              <SegmentedTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <ListSkeleton count={3} avatarSize={44} />
            </View>
          ) : (
            <EmptyState
              icon="package-variant"
              title="暂无借用记录"
              description={itemContextId ? '该物品暂无借用历史，可直接发起借出' : '点击右下角添加借用记录'}
              actionLabel="新增借用"
              buttonVariant="secondary"
              onAction={goCreateBorrowing}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
      />

      <View style={[styles.actionBar, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
        <Button
          title="新增借用"
          onPress={goCreateBorrowing}
          variant="primary"
          icon={<MaterialCommunityIcons name="plus-circle" size={16} color="#FFFFFF" style={styles.actionIcon} />}
        />
      </View>
    </SafeScreen>
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
  actionBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionIcon: {
    marginRight: 6,
  },});
