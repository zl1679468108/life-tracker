import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';
import { Skeleton } from './Skeleton';

interface ListSkeletonProps {
  count?: number;
  avatarSize?: number;
  style?: ViewStyle;
}

/** 通用列表骨架（图标 + 两行文字） */
export function ListSkeleton({ count = 3, avatarSize = 40, style }: ListSkeletonProps) {
  const palette = usePalette();
  return (
    <View style={[styles.wrap, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <Skeleton width={avatarSize} height={avatarSize} borderRadius={avatarSize / 2} />
          <View style={styles.content}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
          </View>
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
