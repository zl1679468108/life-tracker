import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SelectProps {
  /** 筛选器名称，如“分类” */
  label: string;
  /** 当前选中的值 */
  value: string;
  /** 选项列表 */
  options: SelectOption[];
  /** 未选中时的占位文案，默认“全部” */
  placeholder?: string;
  /** 默认值，用于判断当前是否处于激活状态 */
  defaultValue?: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

export function Select({
  label,
  value,
  options,
  placeholder = '全部',
  defaultValue = '',
  onChange,
  style,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;
  const isActive = value !== defaultValue;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: isActive ? `${palette.orange}10` : palette.surface,
            borderColor: isActive ? palette.orange : palette.border,
          },
          style,
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${label}筛选，当前：${selectedLabel}`}
      >
        <View style={styles.triggerTextBox}>
          <Text
            style={[
              styles.triggerText,
              { color: isActive ? palette.orange : palette.text },
            ]}
          >
            {isActive ? `${label}：${selectedLabel}` : `全部${label}`}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="menu-down"
          size={18}
          color={isActive ? palette.orange : palette.textMuted}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: palette.scrim }]}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.title, { color: palette.text }]}>{label}</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.optionsContent}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const selected = value === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      selected && { backgroundColor: palette.surfaceSoft },
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    {option.icon && (
                      <MaterialCommunityIcons
                        name={option.icon as any}
                        size={20}
                        color={selected ? palette.orange : palette.textMuted}
                      />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        { color: selected ? palette.orange : palette.text },
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {selected && (
                      <MaterialCommunityIcons name="check" size={20} color={palette.orange} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  triggerTextBox: {
    flexShrink: 1,
  },
  triggerText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xl,
  },
  scroll: {
    maxHeight: 360,
  },
  optionsContent: {
    paddingBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
});
