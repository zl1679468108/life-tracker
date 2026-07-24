import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize, fontWeight } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';

interface FormSectionProps {
  label: string;
  required?: boolean;
  error?: string;
  density?: 'default' | 'compact';
  children: React.ReactNode;
}

export function FormSection({ label, required, error, density = 'default', children }: FormSectionProps) {
  const colors = useColors();
  const palette = usePalette();
  
  return (
    <View style={[styles.section, density === 'compact' && styles.sectionCompact]}>
      <Text style={[styles.label, density === 'compact' && styles.labelCompact, { color: palette.textSecondary }]}>
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
  sectionCompact: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },
  labelCompact: {
    marginBottom: spacing.sm,
  },
  required: {},
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
