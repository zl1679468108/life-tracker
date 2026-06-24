import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

// 预设颜色列表
const presetColors = [
  '#FF6B35', // 主色
  '#7C5CFC', // 辅助色
  '#10B981', // 成功
  '#F59E0B', // 警告
  '#EF4444', // 危险
  '#3B82F6', // 蓝色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#14B8A6', // 青色
  '#F97316', // 橙色
  '#84CC16', // 黄绿色
  '#06B6D4', // 天蓝色
];

interface ColorPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (color: string) => void;
  currentColor?: string;
}

export function ColorPicker({ visible, onClose, onSelect, currentColor }: ColorPickerProps) {
  const colors = useColors();
  const [customColor, setCustomColor] = useState(currentColor || '');
  const [selectedColor, setSelectedColor] = useState(currentColor || presetColors[0]);

  const handleSelectPreset = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (text: string) => {
    setCustomColor(text);
    // 验证颜色格式
    if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
      setSelectedColor(text);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedColor);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modal, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.gray[200] }]} />
          <Text style={[styles.title, { color: colors.gray[900] }]}>选择颜色</Text>

          {/* 预设颜色 */}
          <View style={styles.presetGrid}>
            {presetColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorItem,
                  { backgroundColor: color },
                  selectedColor === color && [styles.colorItemSelected, { borderColor: colors.gray[900] }],
                ]}
                onPress={() => handleSelectPreset(color)}
              >
                {selectedColor === color && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 自定义颜色输入 */}
          <View style={styles.customSection}>
            <Text style={[styles.customLabel, { color: colors.gray[700] }]}>自定义颜色</Text>
            <View style={styles.customInputRow}>
              <View style={[styles.colorPreview, { backgroundColor: selectedColor, borderColor: colors.gray[200] }]} />
              <TextInput
                style={[styles.customInput, { borderColor: colors.gray[200], color: colors.gray[800] }]}
                value={customColor}
                onChangeText={handleCustomColorChange}
                placeholder="#FF6B35"
                placeholderTextColor={colors.gray[400]}
                maxLength={7}
              />
            </View>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.gray[100] }]} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.gray[600] }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>确认</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.lg,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  colorItem: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorItemSelected: {
    ...shadows.md,
  },
  customSection: {
    marginBottom: spacing.xl,
  },
  customLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  cancelBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  confirmBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
});
