import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useThemeColors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { Input, Button } from './index';
import type { LifeShare } from '../../types';

interface ShareDialogProps {
  visible: boolean;
  onClose: () => void;
  resourceType: 'item' | 'todo';
  resourceId: string;
  shares: LifeShare[];
  loading: boolean;
  onShare: (email: string, permission: 'view' | 'edit') => Promise<void>;
  onUpdatePermission: (shareId: string, permission: 'view' | 'edit') => Promise<void>;
  onDeleteShare: (shareId: string) => Promise<void>;
  onShareSuccess?: () => void; // 分享成功回调（可选，用于关闭对话框等）
}

export function ShareDialog({
  visible,
  onClose,
  resourceType,
  resourceId,
  shares,
  loading,
  onShare,
  onUpdatePermission,
  onDeleteShare,
  onShareSuccess,
}: ShareDialogProps) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [submitting, setSubmitting] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await onShare(email.trim(), permission);
      setEmail('');
      setPermission('view');
      onShareSuccess?.();
    } catch (e) {
      // error handled in store
    }
    setSubmitting(false);
  };

  const renderShareItem = ({ item }: { item: LifeShare }) => (
    <View style={[styles.shareItem, { borderBottomColor: colors.gray[200] }]}>
      <View style={styles.shareInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.gray[800] }]}>
            {item.shared_with_name || '未知用户'}
          </Text>
          <Text style={[styles.date, { color: colors.gray[500] }]}>
            {item.created_at?.split('T')[0]}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: item.permission === 'edit' ? colors.warningLight : colors.successLight }]}
          onPress={() => onUpdatePermission(item.id, item.permission === 'view' ? 'edit' : 'view')}
        >
          <Text style={[styles.permText, { color: item.permission === 'edit' ? colors.warning : colors.success }]}>
            {item.permission === 'view' ? '查看' : '编辑'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeleteShare(item.id)} style={styles.deleteBtn}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.white }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.gray[800] }]}>共享管理</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Add share form */}
          <View style={styles.form}>
            <Input
              label="共享给用户邮箱"
              placeholder="输入用户邮箱"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <View style={styles.permRow}>
              <Text style={[styles.permLabel, { color: colors.gray[700] }]}>权限：</Text>
              <TouchableOpacity
                style={[styles.permChip, { backgroundColor: permission === 'view' ? colors.successLight : colors.gray[100] }]}
                onPress={() => setPermission('view')}
              >
                <Text style={{ color: permission === 'view' ? colors.success : colors.gray[500], fontWeight: fontWeight.medium }}>
                  查看
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.permChip, { backgroundColor: permission === 'edit' ? colors.warningLight : colors.gray[100] }]}
                onPress={() => setPermission('edit')}
              >
                <Text style={{ color: permission === 'edit' ? colors.warning : colors.gray[500], fontWeight: fontWeight.medium }}>
                  编辑
                </Text>
              </TouchableOpacity>
            </View>
            <Button
              title="添加共享"
              onPress={handleShare}
              variant="primary"
              loading={submitting}
            />
          </View>

          {/* Existing shares */}
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.gray[700] }]}>
              已共享 ({shares.length})
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : shares.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="share-variant" size={40} color={colors.gray[300]} />
              <Text style={[styles.emptyText, { color: colors.gray[400] }]}>暂无共享</Text>
            </View>
          ) : (
            <FlatList
              data={shares}
              renderItem={renderShareItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '80%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  form: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  permLabel: {
    fontSize: fontSize.base,
  },
  permChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  listHeader: {
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  shareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  date: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  permBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  permText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  deleteBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});
