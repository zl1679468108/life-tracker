import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../stores/themeStore';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function SafeScreen({ children, style, backgroundColor }: SafeScreenProps) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
