import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, spacing, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'stat' | 'elevated';
}

export function Card({ children, onPress, style, variant = 'default' }: CardProps) {
  const colors = useColors();
  
  const containerStyles = [
    styles.base,
    { backgroundColor: colors.white },
    styles[variant],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        activeOpacity={0.98}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  default: {
    ...shadows.sm,
  },
  stat: {
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
  },
});
