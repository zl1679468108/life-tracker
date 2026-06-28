import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, ViewProps } from 'react-native';
import { SafeScreen } from '../SafeScreen';
import { appDesign, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface AppScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  style?: ViewProps['style'];
}

export function AppScreen({
  children,
  scroll = true,
  error,
  onDismissError,
  contentContainerStyle,
  style,
}: AppScreenProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  return (
    <SafeScreen backgroundColor={palette.bg} error={error} onDismissError={onDismissError}>
      {scroll ? (
        <ScrollView
          style={[styles.container, { backgroundColor: palette.bg }, style]}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, styles.content, { backgroundColor: palette.bg }, style, contentContainerStyle]}>
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 112,
  },
});
