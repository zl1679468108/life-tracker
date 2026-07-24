import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScreen } from '../../components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useThemeStore, usePalette } from '../../stores/themeStore';

type ThemeOption = {
  mode: 'light' | 'dark' | 'system';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const themeOptions: ThemeOption[] = [
  { mode: 'light', label: '浅色模式', icon: 'white-balance-sunny' },
  { mode: 'dark', label: '深色模式', icon: 'moon-waning-crescent' },
  { mode: 'system', label: '跟随系统', icon: 'theme-light-dark' },
];

export default function ThemeSettingsScreen() {
  const { themeMode, setThemeMode } = useThemeStore();
  const palette = usePalette();

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.section}>
        {themeOptions.map((option) => {
          const selected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.optionCard,
                {
                  backgroundColor: selected ? `${palette.orange}14` : palette.surface,
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

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 112,
  },
  section: {
    marginBottom: spacing.lg,
  },
  optionCard: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
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
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
