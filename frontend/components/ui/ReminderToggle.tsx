import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Switch, Chip } from 'react-native-paper';
import { useColors } from '../../hooks/useThemeColors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';

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

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.gray[800] }]}>
          保质期提醒
        </Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          color={colors.primary}
        />
      </View>

      {enabled && (
        <View style={styles.options}>
          <Text style={[styles.subLabel, { color: colors.gray[500] }]}>
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
                  daysBefore === option.value && {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
                textStyle={{
                  color: daysBefore === option.value ? colors.primary : colors.gray[500],
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
  },
});
