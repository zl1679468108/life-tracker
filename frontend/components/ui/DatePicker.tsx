import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: string;
  mode?: 'date' | 'datetime';
  placeholder?: string;
  minDate?: Date;
  error?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  icon,
  mode = 'date',
  placeholder,
  minDate,
  error,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showNative, setShowNative] = useState(false);
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const handleClick = () => {
    if (Platform.OS === 'web') {
      setShowNative(true);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !showNative) return;

    const input = inputRef.current;
    if (!input) return;

    try {
      input.showPicker?.();
      input.focus();
    } catch {
      input.focus();
      input.click();
    }
  }, [showNative]);

  const syncNativeValue = (value: string) => {
    if (mode === 'datetime') {
      onChange(value ? `${value}:00` : '');
    } else {
      onChange(value);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    syncNativeValue(val);
  };

  const handleNativeInput = (e: React.FormEvent<HTMLInputElement>) => {
    syncNativeValue(e.currentTarget.value);
  };

  const handleBlur = () => {
    setTimeout(() => setShowNative(false), 200);
  };

  const normalizedDate = value ? new Date(value) : null;
  const isValidDate = normalizedDate && !Number.isNaN(normalizedDate.getTime());
  const nativeValue = value
    ? mode === 'datetime'
      ? (value.includes('T') ? value.slice(0, 16) : value)
      : (value.includes('T') ? value.slice(0, 10) : value)
    : '';
  const displayValue = value
    ? isValidDate
      ? mode === 'datetime'
        ? normalizedDate.toLocaleString('zh-CN')
        : normalizedDate.toLocaleDateString('zh-CN')
      : value
    : '';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>{label}</Text>
        <View style={styles.webContainer}>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: error ? palette.danger : palette.border, backgroundColor: palette.surfaceSoft }]}
            onPress={handleClick}
          >
            <MaterialCommunityIcons name={icon as any} size={20} color={displayValue ? palette.orange : palette.textMuted} />
            <Text style={[styles.dateText, { color: palette.textMuted }, displayValue ? { color: palette.text } : null]}>
              {displayValue || placeholder || `选择${label}`}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text> : null}
          <input
            ref={inputRef}
            type={mode === 'datetime' ? 'datetime-local' : 'date'}
            value={nativeValue}
            onChange={handleNativeChange}
            onInput={handleNativeInput}
            onBlur={handleBlur}
            min={minDate ? minDate.toISOString().slice(0, mode === 'datetime' ? 16 : 10) : undefined}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>{label}</Text>
      <TouchableOpacity style={[styles.dateInput, { borderColor: error ? palette.danger : palette.border, backgroundColor: palette.surfaceSoft }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={displayValue ? palette.orange : palette.textMuted} />
        <Text style={[styles.dateText, { color: palette.textMuted }, displayValue ? { color: palette.text } : null]}>
          {displayValue || placeholder || `选择${label}`}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },
  webContainer: {
    position: 'relative',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  dateText: {
    fontSize: fontSize.xl,
  },
  errorText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
});
