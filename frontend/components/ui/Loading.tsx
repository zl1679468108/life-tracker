import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { appDesign, fontSize, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface LoadingProps {
  size?: 'small' | 'large';
  text?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

export function Loading({ size = 'large', text, overlay = false, style }: LoadingProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  
  if (overlay) {
    return (
      <View style={[styles.overlay, style]}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={palette.orange} />
          {text && <Text style={[styles.text, { color: palette.textMuted }]}>{text}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={palette.orange} />
      {text && <Text style={[styles.text, { color: palette.textMuted }]}>{text}</Text>}
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
    backgroundColor: 'rgba(8, 17, 31, 0.64)',
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
