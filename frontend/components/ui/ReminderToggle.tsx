import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Switch, Chip } from 'react-native-paper';
import { useColors } from '../../stores/themeStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';

interface ReminderToggleProps {
  enabled: boolean;
  daysBefore: number;
  onToggle: (enabled: boolean) => void;
  onDaysChange: (days: number) => void;
}

const DAYS_OPTIONS = [
  { value: 1, label: '1天' },
  { value: 3, label: '3天' },
  { value: 7, label: '7天' },
  { value: 14, label: '14天' },
  { value: 30, label: '30天' },
];

export function ReminderToggle({
  enabled,
  daysBefore,
  onToggle,
  onDaysChange,
}: ReminderToggleProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: palette.text }]}>
          保质期提醒
        </Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          color={palette.orange}
        />
      </View>

      {enabled && (
        <View style={styles.options}>
          <Text style={[styles.subLabel, { color: palette.textMuted }]}>
            提前提醒时间
          </Text>
          <View style={styles.chipsContainer}>
            {DAYS_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={daysBefore === option.value}
                onPress={() => onDaysChange(option.value)}
                style={[
                  styles.chip,
                  { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
                  daysBefore === option.value && {
                    backgroundColor: palette.surface,
                    borderColor: palette.orange,
                  },
                ]}
                textStyle={{
                  color: daysBefore === option.value ? palette.orange : palette.textMuted,
                }}
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  options: {
    marginTop: spacing.md,
  },
  subLabel: {
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
});
