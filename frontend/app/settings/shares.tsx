import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShareStore } from '../../stores/shareStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';
import { EmptyState, SegmentedTabs, ListSkeleton, AppScreen } from '../../components/ui';
import { showAlert } from '../../lib/alert';
import { formatDateZh } from '../../lib/format';
import type { LifeShare } from '../../types';

type TabType = 'outgoing' | 'incoming';

export default function SharesScreen() {
  const palette = usePalette();
  const {
    outgoingShares,
    incomingShares,
    listLoading,
    fetchOutgoingShares,
    fetchIncomingShares,
    deleteShare,
    updateShare,
  } = useShareStore();
  const [activeTab, setActiveTab] = useState<TabType>('outgoing');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOutgoingShares();
    fetchIncomingShares();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOutgoingShares(), fetchIncomingShares()]);
    setRefreshing(false);
  };

  const handleDeleteShare = (id: string) => {
    showAlert('取消共享', '确认取消此共享关系？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认取消',
        style: 'destructive',
        onPress: async () => {
          await deleteShare(id);
          await fetchOutgoingShares();
        },
      },
    ]);
  };

  const handleTogglePermission = async (share: LifeShare) => {
    const newPerm = share.permission === 'view' ? 'edit' : 'view';
    await updateShare(share.id, { permission: newPerm });
    await fetchOutgoingShares();
  };

  const currentList = activeTab === 'outgoing' ? outgoingShares : incomingShares;
  const tabs = [
    { key: 'outgoing' as const, label: '我共享的', count: outgoingShares.length },
    { key: 'incoming' as const, label: '共享给我', count: incomingShares.length },
  ];

  const renderShareItem = (item: LifeShare) => {
    const isOutgoing = activeTab === 'outgoing';
    const personName = isOutgoing ? item.shared_with_name : item.owner_name;
    const isEdit = item.permission === 'edit';

    return (
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: `${palette.orange}18`, borderColor: `${palette.orange}40` }]}>
            <MaterialCommunityIcons name="account" size={20} color={palette.orange} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.personName, { color: palette.text }]} numberOfLines={1}>
              {personName || '未知用户'}
            </Text>
            <Text style={[styles.resourceName, { color: palette.textMuted }]} numberOfLines={1}>
              {item.resource_type === 'item' ? '物品' : '待办'}：{item.resource_name}
            </Text>
          </View>
          <View
            style={[
              styles.permBadge,
              {
                backgroundColor: isEdit ? `${palette.warning}22` : `${palette.success}22`,
              },
            ]}
          >
            <Text
              style={{
                color: isEdit ? palette.warning : palette.success,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {isEdit ? '编辑' : '查看'}
            </Text>
          </View>
        </View>
        <View style={[styles.cardFooter, { borderTopColor: palette.border }]}>
          <Text style={[styles.dateText, { color: palette.textMuted }]}>
            {formatDateZh(item.created_at)}
          </Text>
          {isOutgoing && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: palette.surfaceSoft }]}
                onPress={() => handleTogglePermission(item)}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={palette.orange} />
                <Text style={[styles.actionText, { color: palette.orange }]}>切换权限</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: `${palette.danger}18` }]}
                onPress={() => handleDeleteShare(item.id)}
              >
                <MaterialCommunityIcons name="delete-outline" size={16} color={palette.danger} />
                <Text style={[styles.actionText, { color: palette.danger }]}>取消共享</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <AppScreen
      scroll
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />
      }
    >
      <SegmentedTabs tabs={tabs} value={activeTab} onChange={setActiveTab} style={{ marginBottom: spacing.md }} />

      {listLoading && currentList.length === 0 ? (
        <ListSkeleton count={3} avatarSize={40} trailing />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon="share-variant"
          title={activeTab === 'outgoing' ? '暂无共享' : '暂无共享给我'}
          description={
            activeTab === 'outgoing'
              ? '在物品详情中点击分享按钮添加共享'
              : '其他用户共享给你的资源会显示在这里'
          }
        />
      ) : (
        currentList.map((item) => <React.Fragment key={item.id}>{renderShareItem(item)}</React.Fragment>)
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  resourceName: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  permBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: fontSize.xs,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  actionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
