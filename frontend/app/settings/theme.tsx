import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useThemeStore, useColors } from '../../stores/themeStore';

type ThemeOption = {
  mode: 'light' | 'dark' | 'system';
  label: string;
  icon: string;
  description: string;
};

const themeOptions: ThemeOption[] = [
  {
    mode: 'light',
    label: '浅色模式',
    icon: 'white-balance-sunny',
    description: '始终使用浅色主题',
  },
  {
    mode: 'dark',
    label: '深色模式',
    icon: 'moon-waning-crescent',
    description: '始终使用深色主题',
  },
  {
    mode: 'system',
    label: '跟随系统',
    icon: 'theme-light-dark',
    description: '自动跟随系统设置',
  },
];

export default function ThemeSettingsScreen() {
  const { themeMode, setThemeMode } = useThemeStore();
  const colors = useColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.gray[900] }]}>主题设置</Text>
        
        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => {
            const isSelected = themeMode === option.mode;
            
            return (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.white,
                    borderColor: isSelected ? colors.primary : colors.gray[200],
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setThemeMode(option.mode)}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.gray[100],
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? colors.primary : colors.gray[600]}
                    />
                  </View>
                  
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                      <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                    </View>
                  )}
                </View>
                
                <Text style={[styles.optionLabel, { color: colors.gray[900] }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDescription, { color: colors.gray[500] }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.previewCard, { backgroundColor: colors.white, ...shadows.sm }]}>
          <Text style={[styles.previewTitle, { color: colors.gray[900] }]}>预览</Text>
          
          <View style={styles.previewContent}>
            <View style={[styles.previewItem, { backgroundColor: colors.primary }]}>
              <Text style={[styles.previewText, { color: colors.white }]}>主要按钮</Text>
            </View>
            
            <View style={[styles.previewItem, { backgroundColor: colors.gray[100] }]}>
              <Text style={[styles.previewText, { color: colors.gray[900] }]}>次要按钮</Text>
            </View>
            
            <View style={[styles.previewItem, { backgroundColor: colors.success }]}>
              <Text style={[styles.previewText, { color: colors.white }]}>成功状态</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  previewCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  previewTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },
  previewContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  previewItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  previewText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
