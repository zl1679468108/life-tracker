import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, ViewProps } from 'react-native';
import { SafeScreen } from '../SafeScreen';
import { spacing } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';

interface AppScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** 是否应用默认左右与上下内边距，默认 true */
  padded?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  style?: ViewProps['style'];
  refreshControl?: ScrollViewProps['refreshControl'];
}

export function AppScreen({
  children,
  scroll = true,
  padded = true,
  error,
  onDismissError,
  contentContainerStyle,
  style,
  refreshControl,
}: AppScreenProps) {
  const colors = useColors();
  const palette = usePalette();
  const padStyle = padded ? styles.contentPadded : styles.contentFlush;

  return (
    <SafeScreen backgroundColor={palette.bg} error={error} onDismissError={onDismissError}>
      {scroll ? (
        <ScrollView
          style={[styles.container, { backgroundColor: palette.bg }, style]}
          contentContainerStyle={[padStyle, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, padStyle, { backgroundColor: palette.bg }, style, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 112,
  },
  contentFlush: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
