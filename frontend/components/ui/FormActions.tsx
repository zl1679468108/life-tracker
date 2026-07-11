import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing } from '../../constants/theme';
import { Button } from './Button';

interface FormActionsProps {
  onCancel?: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  hideCancel?: boolean;
  style?: ViewStyle;
}

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = '保存',
  cancelLabel = '取消',
  loading = false,
  disabled = false,
  hideCancel = false,
  style,
}: FormActionsProps) {
  return (
    <View style={[styles.actions, style]}>
      {!hideCancel && (
        <Button title={cancelLabel} variant="secondary" onPress={onCancel || (() => {})} style={styles.button} disabled={loading} />
      )}
      <Button title={submitLabel} variant="primary" onPress={onSubmit} style={styles.button} loading={loading} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});
