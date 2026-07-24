import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { spacing, borderRadius } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** 单个骨架条 */
export function Skeleton({
  width = '100%',
  height = 14,
  borderRadius: br = 4,
  style,
}: SkeletonProps) {
  const palette = usePalette();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { backgroundColor: palette.surfaceSoft, width, height, borderRadius: br, opacity },
        style,
      ]}
    />
  );
}

/** 列表骨架屏（多条） */
interface SkeletonListProps {
  rows?: number;
  rowHeight?: number;
  showAvatar?: boolean;
  style?: ViewStyle;
}

export function SkeletonList({ rows = 5, rowHeight = 72, showAvatar = true, style }: SkeletonListProps) {
  const p = usePalette();

  return (
    <View style={[{ paddingHorizontal: spacing.lg, gap: spacing.md }, style]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.listRow,
            {
              height: rowHeight,
              backgroundColor: p.surface,
              borderColor: p.border,
            },
          ]}
        >
          {showAvatar && <Skeleton width={40} height={40} borderRadius={20} />}
          <View style={styles.listRowText}>
            <Skeleton width="65%" height={13} borderRadius={4} />
            <View style={{ height: spacing.xs }} />
            <Skeleton width="40%" height={11} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** 卡片骨架屏 */
interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: SkeletonCardProps) {
  const p = usePalette();

  return (
    <View
      style={[
        {
          backgroundColor: p.surface,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: p.border,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <Skeleton width="55%" height={15} borderRadius={4} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${75 - i * 10}%`}
          height={11}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  listRowText: {
    flex: 1,
    justifyContent: 'center',
  },
});
