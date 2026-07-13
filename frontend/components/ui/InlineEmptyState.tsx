import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface InlineEmptyStateProps {
  /** 空状态主文案 */
  title: string;
  /** 可选副文案 */
  description?: string;
  style?: ViewStyle;
}

/**
 * 紧凑型内联空状态组件。
 * 用于卡片、列表区块内部的空状态提示，图标固定，文案字体较小。
 */
export function InlineEmptyState({ title, description, style }: InlineEmptyStateProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
        ]}
      >
        <MaterialCommunityIcons name="clipboard-outline" size={24} color={palette.textMuted} />
      </View>
      <Text style={[styles.title, { color: palette.textMuted }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: palette.textMuted }]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    textAlign: 'center',
  },
});
