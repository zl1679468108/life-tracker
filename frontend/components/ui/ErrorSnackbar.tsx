import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface ErrorSnackbarProps {
  message: string | null;
  visible: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function ErrorSnackbar({ message, visible, onDismiss, action }: ErrorSnackbarProps) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 100,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  }, [visible, translateY]);

  if (!visible && !message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.danger,
          transform: [{ translateY }],
        },
      ]}
    >
      <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={styles.actionBtn}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.md + 34, // safe area bottom
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
