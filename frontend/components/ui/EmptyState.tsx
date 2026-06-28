import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, fontSize, fontWeight, spacing, borderRadius } from '../../constants/theme';
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
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
        <MaterialCommunityIcons name={icon as any} size={48} color={palette.textMuted} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: palette.textMuted }]}>{description}</Text>}
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
    borderWidth: 1,
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
