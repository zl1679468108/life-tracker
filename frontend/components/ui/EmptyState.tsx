import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontSize, fontWeight, spacing, borderRadius } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  buttonVariant?: 'primary' | 'secondary' | 'text' | 'danger';
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  buttonVariant = 'primary',
  style,
}: EmptyStateProps) {
  const colors = useColors();
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.gray[100] }]}>
        <MaterialCommunityIcons name={icon as any} size={48} color={colors.gray[300]} />
      </View>
      <Text style={[styles.title, { color: colors.gray[700] }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: colors.gray[400] }]}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant={buttonVariant}
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.xl * 4,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 140,
  },
});
