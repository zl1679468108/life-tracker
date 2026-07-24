import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShareStore } from '../../stores/shareStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { EmptyState, ShareDialog, Skeleton } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { showAlert } from '../../lib/alert';
import type { LifeShare } from '../../types';

type TabType = 'outgoing' | 'incoming';

export default function SharesScreen() {
  const router = useRouter();
  const colors = useColors();
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

  const renderShareItem = (item: LifeShare) => {
    const isOutgoing = activeTab === 'outgoing';
    const personName = isOutgoing ? item.shared_with_name : item.owner_name;

    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.personName, { color: colors.gray[800] }]}>
              {personName || '未知用户'}
            </Text>
            <Text style={[styles.resourceName, { color: colors.gray[500] }]}>
              {item.resource_type === 'item' ? '物品' : '待办'}：{item.resource_name}
            </Text>
          </View>
          <View style={[styles.permBadge, {
            backgroundColor: item.permission === 'edit' ? colors.warningLight : colors.successLight,
          }]}>
            <Text style={{ color: item.permission === 'edit' ? colors.warning : colors.success, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
              {item.permission === 'view' ? '查看' : '编辑'}
            </Text>
          </View>
        </View>
        <View style={[styles.cardFooter, { borderTopColor: colors.gray[100] }]}>
          <Text style={[styles.dateText, { color: colors.gray[400] }]}>
            {item.created_at?.split('T')[0]}
          </Text>
          {isOutgoing && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.gray[50] }]}
                onPress={() => handleTogglePermission(item)}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>切换权限</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                onPress={() => handleDeleteShare(item.id)}
              >
                <MaterialCommunityIcons name="delete-outline" size={16} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>取消共享</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeScreen backgroundColor={colors.gray[50]}>
      <View style={[styles.tabBar, { backgroundColor: colors.white }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'outgoing' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[styles.tabText, { color: colors.gray[500] }, activeTab === 'outgoing' && { color: colors.primary, fontWeight: fontWeight.semiBold }]}>
            我共享的 ({outgoingShares.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, { color: colors.gray[500] }, activeTab === 'incoming' && { color: colors.primary, fontWeight: fontWeight.semiBold }]}>
            共享给我 ({incomingShares.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ backgroundColor: colors.gray[50] }}
        contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* 首次加载时显示骨架屏，避免白屏 */}
        {listLoading && currentList.length === 0 ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, { backgroundColor: colors.white }]}>
              <View style={styles.cardHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="35%" height={11} />
                </View>
                <Skeleton width={44} height={20} borderRadius={borderRadius.sm} />
              </View>
              <View style={[styles.cardFooter, { borderTopColor: colors.gray[100] }]}>
                <Skeleton width="20%" height={10} />
                <Skeleton width="30%" height={10} />
              </View>
            </View>
          ))
        ) : currentList.length === 0 ? (
          <EmptyState
            icon="share-variant"
            title={activeTab === 'outgoing' ? '暂无共享' : '暂无共享给我'}
            description={activeTab === 'outgoing' ? '在物品详情中点击分享按钮添加共享' : '其他用户共享给你的资源会显示在这里'}
          />
        ) : (
          currentList.map((item) => (
            <React.Fragment key={item.id}>{renderShareItem(item)}</React.Fragment>
          ))
        )}
      </ScrollView>
    </SafeScreen>
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
  },
  card: {
    borderRadius: borderRadius.lg,
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
