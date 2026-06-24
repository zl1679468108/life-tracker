import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface FormSectionProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormSection({ label, required, error, children }: FormSectionProps) {
  const colors = useColors();
  
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.gray[700] }]}>
        {label}
        {required && <Text style={[styles.required, { color: colors.danger }]}> *</Text>}
      </Text>
      {children}
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
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
