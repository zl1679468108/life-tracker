import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface BadgeProps {
  label: string;
  variant?: 'high' | 'medium' | 'low';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'medium', style }: BadgeProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  
  const variantStyles = {
    high: { backgroundColor: palette.surfaceSoft, color: palette.danger },
    medium: { backgroundColor: palette.surfaceSoft, color: palette.warning },
    low: { backgroundColor: palette.surfaceSoft, color: palette.success },
  };
  
  const currentVariant = variantStyles[variant];
  
  const containerStyles = [
    styles.base,
    { backgroundColor: currentVariant.backgroundColor, borderColor: palette.border },
    style,
  ];

  return (
    <View style={containerStyles}>
      <Text style={[styles.text, { color: currentVariant.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
