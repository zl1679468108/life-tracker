import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: string;
  mode?: 'date' | 'datetime';
  placeholder?: string;
  minDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  icon,
  mode = 'date',
  placeholder,
  minDate,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showNative, setShowNative] = useState(false);
  const colors = useColors();

  const handleClick = () => {
    if (Platform.OS === 'web') {
      setShowNative(true);
      setTimeout(() => inputRef.current?.showPicker?.(), 100);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (mode === 'datetime') {
      onChange(val ? `${val}:00` : '');
    } else {
      onChange(val);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowNative(false), 200);
  };

  const displayValue = value
    ? mode === 'datetime'
      ? new Date(value).toLocaleString('zh-CN')
      : value
    : '';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.gray[700] }]}>{label}</Text>
        <View style={styles.webContainer}>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: colors.gray[200], backgroundColor: colors.gray[50] }]}
            onPress={handleClick}
          >
            <MaterialCommunityIcons name={icon as any} size={20} color={colors.gray[400]} />
            <Text style={[styles.dateText, { color: colors.gray[400] }, displayValue ? { color: colors.gray[800] } : null]}>
              {displayValue || placeholder || `选择${label}`}
            </Text>
          </TouchableOpacity>
          {showNative && (
            <input
              ref={inputRef}
              type={mode === 'datetime' ? 'datetime-local' : 'date'}
              value={value}
              onChange={handleNativeChange}
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
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.gray[700] }]}>{label}</Text>
      <TouchableOpacity style={[styles.dateInput, { borderColor: colors.gray[200], backgroundColor: colors.gray[50] }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.gray[400]} />
        <Text style={[styles.dateText, { color: colors.gray[400] }, displayValue ? { color: colors.gray[800] } : null]}>
          {displayValue || placeholder || `选择${label}`}
        </Text>
      </TouchableOpacity>
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
});
