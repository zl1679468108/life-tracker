import React from 'react';
import { View, Text, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, fontSize, fontWeight, spacing, borderRadius } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Button } from './Button';

type EmptyVariant = 'items' | 'todos' | 'messages' | 'categories' | 'locations' | 'calendar' | 'notifications' | 'borrowings' | 'templates' | 'assets' | 'widgets' | 'generic';

const variantConfig: Record<EmptyVariant, { icon: string; iconBg: string; accent: string }> = {
  items: { icon: 'package-variant-closed', iconBg: '#fff5ed', accent: '#F36F3C' },
  todos: { icon: 'clipboard-list-outline', iconBg: '#ecfdf5', accent: '#10A66E' },
  messages: { icon: 'message-text-outline', iconBg: '#f0edff', accent: '#7C5CFC' },
  categories: { icon: 'shape-outline', iconBg: '#fef2f2', accent: '#E84A5F' },
  locations: { icon: 'map-marker-outline', iconBg: '#fff8e1', accent: '#D89400' },
  calendar: { icon: 'calendar-month-outline', iconBg: '#e8f5e9', accent: '#43A047' },
  notifications: { icon: 'bell-outline', iconBg: '#fff3e0', accent: '#FF6B35' },
  borrowings: { icon: 'handshake-outline', iconBg: '#e3f2fd', accent: '#1E88E5' },
  templates: { icon: 'file-outline', iconBg: '#f3e5f5', accent: '#8E24AA' },
  assets: { icon: 'wallet-outline', iconBg: '#e8f5e9', accent: '#2E7D32' },
  widgets: { icon: 'view-grid-outline', iconBg: '#e0f7fa', accent: '#00838F' },
  generic: { icon: 'inbox', iconBg: '#f1efef', accent: '#888780' },
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  buttonVariant?: 'primary' | 'secondary' | 'text' | 'danger';
  variant?: EmptyVariant;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  buttonVariant = 'primary',
  variant = 'generic',
  style,
}: EmptyStateProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { width: screenW } = useWindowDimensions();

  const config = variantConfig[variant] || variantConfig.generic;
  const usedIcon = icon || config.icon;
  const usedAccent = config.accent;
  const usedBg = variant === 'generic' ? palette.surfaceSoft : config.iconBg;

  return (
    <View style={[styles.container, style]}>
      {/* decorative SVG dots */}
      <View style={styles.svgWrapper} pointerEvents="none">
        <Svg width={screenW * 0.4} height={180} viewBox="0 0 200 200">
          <G opacity={palette.bg === appDesign.dark.bg ? 0.15 : 0.08}>
            <Circle cx="100" cy="80" r="60" fill={usedAccent} opacity={0.15} />
            <Circle cx="80" cy="100" r="40" fill={usedAccent} opacity={0.15} />
            <Circle cx="130" cy="120" r="28" fill={usedAccent} opacity={0.1} />
            <Circle cx="45" cy="60" r="16" fill={usedAccent} opacity={0.08} />
            <Circle cx="155" cy="50" r="12" fill={usedAccent} opacity={0.06} />
          </G>
        </Svg>
      </View>

      {/* icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: variant === 'generic' ? palette.surfaceSoft : usedBg,
            borderColor: palette.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={usedIcon as any}
          size={52}
          color={variant === 'generic' ? palette.textMuted : usedAccent}
        />
      </View>

      {/* text */}
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: palette.textMuted }]}>{description}</Text>
      )}

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
  svgWrapper: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
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
    lineHeight: fontSize.lg * 1.5,
  },
  button: {
    minWidth: 140,
  },
});
