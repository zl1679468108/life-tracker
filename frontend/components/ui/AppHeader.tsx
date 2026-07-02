import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, borderRadius, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

export type HeaderAction = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
  unreadDot?: boolean;
};

interface AppHeaderProps {
  title: string;
  actions?: HeaderAction[];
  backAction?: HeaderAction;
  align?: 'left' | 'center';
  leftActions?: HeaderAction[];
}

export function AppHeader({ title, actions = [], backAction, align = 'left', leftActions = [] }: AppHeaderProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const renderAction = (action: HeaderAction, isBack = false) => {
    const color = action.tone === 'primary' ? palette.orange : action.tone === 'danger' ? palette.danger : palette.textSecondary;
    return (
      <TouchableOpacity
        key={action.label}
        style={[
          styles.iconButton,
          isBack && styles.backButton,
          { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
        ]}
        onPress={action.onPress}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <MaterialCommunityIcons name={action.icon} size={20} color={color} />
        {action.unreadDot ? <View style={[styles.unreadDot, { backgroundColor: palette.danger, borderColor: palette.surfaceSoft }]} /> : null}
      </TouchableOpacity>
    );
  };

  const leadingActions = backAction ? [backAction] : leftActions;
  const hasLeading = leadingActions.length > 0;

  return (
    <View style={[styles.header, align === 'center' && styles.headerCenter]}>
      <View style={[styles.side, align === 'center' ? styles.sideBalanced : hasLeading ? styles.sideLeft : styles.sideCollapsed]}>
        {leadingActions.map((action, index) => renderAction(action, Boolean(backAction) && index === 0))}
      </View>
      <Text style={[styles.title, align === 'center' ? styles.titleCenter : styles.titleLeft, { color: palette.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, align === 'center' ? styles.sideBalanced : styles.sideRight]}>{actions.map((action) => renderAction(action))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerCenter: {
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  titleLeft: {
    flex: 1,
  },
  titleCenter: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  side: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  sideBalanced: {
    minWidth: 44,
  },
  sideLeft: {
    marginRight: spacing.sm,
  },
  sideCollapsed: {
    width: 0,
    marginRight: 0,
  },
  sideRight: {
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    marginRight: spacing.xs,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
