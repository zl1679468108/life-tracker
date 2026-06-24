import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface BadgeProps {
  label: string;
  variant?: 'high' | 'medium' | 'low';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'medium', style }: BadgeProps) {
  const colors = useColors();
  
  const variantStyles = {
    high: { backgroundColor: colors.dangerLight, color: colors.danger },
    medium: { backgroundColor: colors.warningLight, color: colors.warning },
    low: { backgroundColor: colors.successLight, color: colors.success },
  };
  
  const currentVariant = variantStyles[variant];
  
  const containerStyles = [
    styles.base,
    { backgroundColor: currentVariant.backgroundColor },
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
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
