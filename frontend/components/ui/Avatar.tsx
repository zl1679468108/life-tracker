import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  label?: string;
  style?: ViewStyle;
}

export function Avatar({ size = 'md', icon = 'person', label, style }: AvatarProps) {
  const colors = useColors();
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 28,
    xl: 36,
  };

  const containerSize = sizeMap[size];
  const iconSize = iconSizeMap[size];

  return (
    <View
      style={[
        styles.container,
        { width: containerSize, height: containerSize, borderRadius: containerSize / 2, backgroundColor: colors.primary },
        style,
      ]}
    >
      {label ? (
        <Text style={[styles.label, { fontSize: iconSize, color: colors.white }]}>{label}</Text>
      ) : (
        <MaterialCommunityIcons name={icon as any} size={iconSize} color={colors.white} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: fontWeight.bold,
  },
});
