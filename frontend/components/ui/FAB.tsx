import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shadows } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';

interface FABProps {
  icon?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function FAB({ icon = 'plus', onPress, variant = 'primary', style }: FABProps) {
  const colors = useColors();
  const palette = usePalette();
  const backgroundColor = variant === 'primary' ? palette.orange : palette.violet;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.container, { backgroundColor }, style]}
    >
      <MaterialCommunityIcons name={icon as any} size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
