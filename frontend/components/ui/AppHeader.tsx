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
};

interface AppHeaderProps {
  title: string;
  actions?: HeaderAction[];
  backAction?: HeaderAction;
}

export function AppHeader({ title, actions = [], backAction }: AppHeaderProps) {
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.header}>
      {backAction && renderAction(backAction, true)}
      <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.actions}>{actions.map((action) => renderAction(action))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    marginRight: spacing.xs,
  },
});
