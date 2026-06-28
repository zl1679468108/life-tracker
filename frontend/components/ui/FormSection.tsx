import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { appDesign, spacing, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface FormSectionProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormSection({ label, required, error, children }: FormSectionProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>
        {label}
        {required && <Text style={[styles.required, { color: palette.danger }]}> *</Text>}
      </Text>
      {children}
      {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },
  required: {},
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
