import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontSize, spacing } from '../../constants/theme';
import type { AppPalette } from '../../stores/themeStore';

type Props = {
  palette: AppPalette;
  text: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

/** 新对话 / 搜索弹层内的空态与加载态 */
export function SheetStatus({ palette, text, icon }: Props) {
  return (
    <View style={styles.sheetStatus}>
      {icon ? (
        <MaterialCommunityIcons name={icon} size={28} color={palette.textMuted} />
      ) : (
        <ActivityIndicator size="small" color={palette.orange} />
      )}
      <Text style={[styles.sheetStatusText, { color: palette.textMuted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetStatus: {
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sheetStatusText: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
  },
});
