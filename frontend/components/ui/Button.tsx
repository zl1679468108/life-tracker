import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colors = useColors();

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.base, styles[`size_${size}`] as ViewStyle];

    if (variant === 'primary') baseStyle.push({ backgroundColor: colors.primary });
    else if (variant === 'secondary') baseStyle.push({ backgroundColor: colors.gray[100] });
    else if (variant === 'danger') baseStyle.push({ backgroundColor: colors.dangerLight });
    else baseStyle.push(styles.text);

    if (disabled) baseStyle.push(styles.disabled);
    if (style) baseStyle.push(style);

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.textBase];

    if (variant === 'primary') baseStyle.push({ color: colors.white });
    else if (variant === 'secondary') baseStyle.push({ color: colors.gray[600] });
    else if (variant === 'danger') baseStyle.push({ color: colors.danger });
    else baseStyle.push({ color: colors.primary });

    baseStyle.push(styles[`textSize_${size}`] as TextStyle);
    if (textStyle) baseStyle.push(textStyle);

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  text: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: spacing.lg,
  },
  size_md: {
    height: 48,
    paddingHorizontal: spacing.xl,
  },
  size_lg: {
    height: 52,
    paddingHorizontal: spacing.xl,
  },
  textBase: {
    fontWeight: '600' as const,
  },
  textSize_sm: {
    fontSize: fontSize.lg,
  },
  textSize_md: {
    fontSize: fontSize.xl,
  },
  textSize_lg: {
    fontSize: fontSize.xl,
  },
});
