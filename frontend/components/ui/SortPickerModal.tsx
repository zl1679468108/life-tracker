import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';

export type SortOption<T extends string = string> = {
  key: T;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

interface SortPickerModalProps<T extends string = string> {
  visible: boolean;
  title?: string;
  options: SortOption<T>[];
  value: T;
  onChange: (key: T) => void;
  onClose: () => void;
}

/**
 * 底部排序选择弹层（物品列表 / 待办列表共用）
 */
export function SortPickerModal<T extends string = string>({
  visible,
  title = '排序方式',
  options,
  value,
  onChange,
  onClose,
}: SortPickerModalProps<T>) {
  const palette = usePalette();
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={[styles.overlay, { backgroundColor: palette.scrim }]}
      activeOpacity={1}
      onPress={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.border }]}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, active && { backgroundColor: palette.surfaceSoft }]}
              onPress={() => {
                onChange(opt.key);
                onClose();
              }}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={20}
                color={active ? palette.orange : palette.textMuted}
              />
              <Text style={[styles.optionText, { color: active ? palette.orange : palette.text }]}>
                {opt.label}
              </Text>
              {active && <MaterialCommunityIcons name="check" size={20} color={palette.orange} />}
            </TouchableOpacity>
          );
        })}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  modal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});
