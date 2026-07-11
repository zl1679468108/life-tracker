import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface FormCardProps {
  /** 卡片标题，留空则不渲染标题行 */
  title?: string;
  /** 标题前竖条的主题色，默认使用 palette.orange */
  accentColor?: string;
  /** 自定义卡片容器样式 */
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * 统一的表单卡片：圆角描边容器 + 带主题色竖条的标题行。
 * 用于 item / todo / borrowing 等创建/编辑页，保证视觉一致。
 */
export function FormCard({ title, accentColor, style, children }: FormCardProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const barColor = accentColor ?? palette.orange;

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>
      {title ? (
        <View style={styles.titleRow}>
          <View style={[styles.titleBar, { backgroundColor: barColor }]} />
          <Text style={[styles.title, { color: palette.textSecondary }]}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
});
