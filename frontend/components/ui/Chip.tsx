import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, icon, style }: ChipProps) {
  const colors = useColors();
  
  const containerStyles = [
    styles.base,
    { backgroundColor: colors.gray[100] },
    selected && { backgroundColor: colors.primary },
    style,
  ];

  const textStyles = [
    styles.text,
    { color: colors.gray[600] },
    selected && { color: colors.white },
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
          color={selected ? colors.white : colors.gray[600]}
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
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
