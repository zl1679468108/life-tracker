import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { useColors } from '../stores/themeStore';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export function Toast({ visible, message, type = 'success', duration = 1500 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current as Animated.Value;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const colors = useColors();

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      clearTimeout(timerRef.current);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
    }
  }, [visible, message]);

  if (!visible) return null;

  const bgColor = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.gray[700];
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'information';

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: bgColor }]} pointerEvents="none">
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.white} />
      <Text style={styles.message}>{message}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 9999,
  },
  message: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: '#FFFFFF',
  },
});
