import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Loading } from './Loading';
import { Skeleton } from './Skeleton';

interface PageLoadableProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  /** 首次加载用骨架屏，后续刷新用普通加载 */
  skeleton?: boolean;
  children: React.ReactNode;
}

/** 
 * 统一处理页面的 加载中 / 错误 / 空数据 / 正常 四种状态。
 * - 首次加载（skeleton=true）时显示骨架屏
 * - 首次加载（skeleton=false）时显示 loading 指示器
 * - 后续刷新仅在顶部显示 loading
 * - 错误时显示重试按钮
 * - 空数据时显示空状态引导
 */
export function PageLoadable({
  loading,
  error,
  empty = false,
  emptyIcon = 'inbox-outline',
  emptyTitle,
  emptyMessage,
  onRetry,
  onEmptyAction,
  emptyActionLabel,
  skeleton = true,
  children,
}: PageLoadableProps) {
  const colors = useColors();

  // 错误状态
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color={colors.gray[300]} />
        <Text style={[styles.errorTitle, { color: colors.gray[600] }]}>加载失败</Text>
        <Text style={[styles.errorMsg, { color: colors.gray[400] }]}>{error}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 首次加载骨架屏
  if (loading && skeleton) {
    return <SkeletonPage />;
  }

  // 首次加载 spinner
  if (loading) {
    return <Loading />;
  }

  // 空数据状态
  if (empty) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name={emptyIcon as any} size={64} color={colors.gray[200]} />
        {emptyTitle && <Text style={[styles.emptyTitle, { color: colors.gray[500] }]}>{emptyTitle}</Text>}
        {emptyMessage && <Text style={[styles.emptyMsg, { color: colors.gray[400] }]}>{emptyMessage}</Text>}
        {onEmptyAction && emptyActionLabel && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={onEmptyAction}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>{emptyActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

/** 默认全屏骨架屏 */
function SkeletonPage() {
  const colors = useColors();
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: colors.gray[50] }]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.white }]}>
          <Skeleton width={52} height={52} borderRadius={14} />
          <View style={styles.skeletonContent}>
            <Skeleton width="60%" height={16} />
            <View style={styles.skeletonRow}>
              <Skeleton width={50} height={12} />
              <Skeleton width={80} height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMsg: {
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMsg: {
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  skeletonContainer: {
    padding: spacing.lg,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
