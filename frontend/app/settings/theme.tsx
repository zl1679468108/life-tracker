import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScreen } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors, useThemeStore } from '../../stores/themeStore';

type ThemeOption = {
  mode: 'light' | 'dark' | 'system';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
};

const themeOptions: ThemeOption[] = [
  { mode: 'light', label: '浅色模式', icon: 'white-balance-sunny', description: '始终使用浅色主题' },
  { mode: 'dark', label: '深色模式', icon: 'moon-waning-crescent', description: '始终使用深色主题' },
  { mode: 'system', label: '跟随系统', icon: 'theme-light-dark', description: '自动跟随系统设置' },
];

export default function ThemeSettingsScreen() {
  const { themeMode, setThemeMode } = useThemeStore();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>主题设置</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.badgeValue, { color: palette.text }]}>
              {themeMode === 'light' ? '浅色' : themeMode === 'dark' ? '深色' : '系统'}
            </Text>
            <Text style={[styles.badgeLabel, { color: palette.textMuted }]}>当前主题</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        {themeOptions.map((option) => {
          const selected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.optionCard,
                {
                  backgroundColor: selected ? '#FFF4EC' : palette.surface,
                  borderColor: selected ? palette.orange : palette.border,
                },
              ]}
              onPress={() => setThemeMode(option.mode)}
              activeOpacity={0.82}
            >
              <View style={[styles.optionIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name={option.icon} size={20} color={selected ? palette.orange : palette.textSecondary} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: palette.text }]}>{option.label}</Text>
                <Text style={[styles.optionDescription, { color: palette.textMuted }]}>{option.description}</Text>
              </View>
              {selected ? (
                <View style={[styles.checkWrap, { backgroundColor: palette.orange }]}>
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                </View>
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.previewCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.previewTitle, { color: palette.text }]}>界面预览</Text>
        <View style={styles.previewGrid}>
          <View style={[styles.previewChip, { backgroundColor: palette.orange }]}>
            <Text style={styles.previewChipText}>主操作</Text>
          </View>
          <View style={[styles.previewChip, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, borderWidth: 1 }]}>
            <Text style={[styles.previewChipText, { color: palette.text }]}>次要信息</Text>
          </View>
          <View style={[styles.previewChip, { backgroundColor: palette.success }]}>
            <Text style={styles.previewChipText}>成功状态</Text>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 112,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['4xl'],
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  badge: {
    minWidth: 76,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeValue: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  badgeLabel: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  optionCard: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  optionDescription: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewChip: {
    minHeight: 34,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewChipText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
  },
});
