import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface AppListRowProps {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  letter?: string;
  accent?: string;
  meta?: React.ReactNode;
  unread?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export function AppListRow({
  title,
  description,
  icon,
  letter,
  accent,
  meta,
  unread = false,
  disabled = false,
  style,
  onPress,
}: AppListRowProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const tone = accent || palette.orange;
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }, disabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled}
    >
      <View style={[styles.mark, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={tone} />
        ) : (
          <Text style={[styles.letter, { color: tone }]}>{letter || title.slice(0, 1)}</Text>
        )}
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
          {title}
        </Text>
        {!!description && (
          <Text style={[styles.description, { color: palette.textMuted }]} numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>
      {unread ? (
        <View style={[styles.dot, { backgroundColor: palette.danger }]} />
      ) : meta ? (
        meta
      ) : onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  disabled: {
    opacity: 0.58,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
