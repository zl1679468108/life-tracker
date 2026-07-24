import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';

export type SegmentedTabItem<T extends string = string> = {
  key: T;
  label: string;
  count?: number;
};

interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  style?: ViewStyle;
  /** 是否展示 count 徽章，默认 true（有 count 时显示） */
  showCount?: boolean;
}

/**
 * 统一分段筛选 Tabs（模板/借用/通知/待办列表等）
 */
export function SegmentedTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  style,
  showCount = true,
}: SegmentedTabsProps<T>) {
  const palette = usePalette();

  return (
    <View style={[styles.wrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, style]}>
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              active && { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, { color: active ? palette.text : palette.textMuted }]}>
              {tab.label}
            </Text>
            {showCount && tab.count !== undefined && (
              <Text style={[styles.count, { color: active ? palette.orange : palette.textMuted }]}>
                {tab.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  count: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
});
