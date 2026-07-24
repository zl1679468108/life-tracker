import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';
import { Skeleton } from './Skeleton';

interface ListSkeletonProps {
  count?: number;
  avatarSize?: number;
  /** 右侧小徽章/按钮占位（待办列表等） */
  trailing?: boolean;
  style?: ViewStyle;
}

/** 通用列表骨架（图标 + 两行文字 [+ 右侧]） */
export function ListSkeleton({ count = 3, avatarSize = 40, trailing = false, style }: ListSkeletonProps) {
  const palette = usePalette();
  return (
    <View style={[styles.wrap, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <Skeleton width={avatarSize} height={avatarSize} borderRadius={Math.min(avatarSize / 2, 8)} />
          <View style={styles.content}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
          </View>
          {trailing ? <Skeleton width={50} height={20} borderRadius={6} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
});
