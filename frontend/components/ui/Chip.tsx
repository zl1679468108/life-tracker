import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, icon, style }: ChipProps) {
  const colors = useColors();
  const palette = usePalette();
  
  const containerStyles = [
    styles.base,
    { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
    selected && { backgroundColor: palette.orange, borderColor: palette.orange },
    style,
  ];

  const textStyles = [
    styles.text,
    { color: palette.textMuted },
    selected && { color: '#FFFFFF' },
  ];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={14}
          color={selected ? '#FFFFFF' : palette.textMuted}
          style={styles.icon}
        />
      )}
      <Text style={textStyles}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
