import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../stores/themeStore';
import { ErrorSnackbar } from './ui/ErrorSnackbar';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  error?: string | null;
  onDismissError?: () => void;
  errorAction?: {
    label: string;
    onPress: () => void;
  };
}

export function SafeScreen({ children, style, backgroundColor, error, onDismissError, errorAction }: SafeScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: backgroundColor || colors.gray[50],
        },
        style,
      ]}
    >
      {children}
      <ErrorSnackbar
        message={error ?? null}
        visible={!!error}
        onDismiss={onDismissError}
        action={errorAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
