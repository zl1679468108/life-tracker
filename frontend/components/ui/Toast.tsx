import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontSize, fontWeight, spacing, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide?: () => void;
  style?: ViewStyle;
}

export function Toast({ message, type = 'info', visible, onHide, style }: ToastProps) {
  const colors = useColors();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateYAnim] = useState(new Animated.Value(20));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const backgroundColor = type === 'success'
    ? colors.success
    : type === 'error'
    ? colors.danger
    : colors.gray[800];

  const iconName = type === 'success'
    ? 'check-circle'
    : type === 'error'
    ? 'alert-circle'
    : 'information';

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor },
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
    ...shadows.md,
    zIndex: 2000,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
  },
});
