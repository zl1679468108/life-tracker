import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface CheckboxProps {
  checked?: boolean;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
}

export function Checkbox({ checked = false, onPress, size = 22, style }: CheckboxProps) {
  const colors = useColors();
  
  return (
    <TouchableOpacity
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size * 0.27, borderColor: colors.gray[300] },
        checked && { backgroundColor: colors.success, borderColor: colors.success },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {checked && (
        <MaterialCommunityIcons
          name="check"
          size={size * 0.72}
          color={colors.white}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
