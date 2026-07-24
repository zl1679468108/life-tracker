import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  /** 自动隐藏时长（ms）；默认 1500。传 0 表示不自动隐藏。 */
  duration?: number;
  onHide?: () => void;
  style?: ViewStyle;
}

export function Toast({
  message,
  type = 'info',
  visible,
  duration = 1500,
  onHide,
  style,
}: ToastProps) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!visible) {
      clearTimeout(timerRef.current);
      opacity.setValue(0);
      translateY.setValue(20);
      return;
    }

    clearTimeout(timerRef.current);
    opacity.setValue(0);
    translateY.setValue(20);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);
    }

    return () => clearTimeout(timerRef.current);
  }, [visible, message, duration, opacity, translateY, onHide]);

  if (!visible) return null;

  const backgroundColor =
    type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.gray[700];
  const iconName =
    type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'information';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { backgroundColor, opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      <MaterialCommunityIcons name={iconName as any} size={18} color={colors.white} />
      <Text style={[styles.text, { color: colors.white }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
    zIndex: 9999,
    elevation: 4,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});
