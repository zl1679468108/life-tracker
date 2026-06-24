import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, fontSize, fontWeight } from '../constants/theme';
import { useColors } from '../stores/themeStore';

interface DeleteButtonProps {
  label?: string;
  onPress: () => void;
}

export function DeleteButton({ label = '删除', onPress }: DeleteButtonProps) {
  const colors = useColors();
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons name="delete-outline" size={18} color={colors.danger} />
      <Text style={[styles.text, { color: colors.danger }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
