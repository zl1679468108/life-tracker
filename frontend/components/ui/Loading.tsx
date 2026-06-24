import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { fontSize, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface LoadingProps {
  size?: 'small' | 'large';
  text?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

export function Loading({ size = 'large', text, overlay = false, style }: LoadingProps) {
  const colors = useColors();
  
  if (overlay) {
    return (
      <View style={[styles.overlay, style]}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={colors.primary} />
          {text && <Text style={[styles.text, { color: colors.gray[500] }]}>{text}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && <Text style={[styles.text, { color: colors.gray[500] }]}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  overlayContent: {
    alignItems: 'center',
  },
  text: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
  },
});
