import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TouchableOpacity, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  required?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  style,
  leftIcon,
  rightIcon,
  onRightIconPress,
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  required = false,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const inputRef = useRef<TextInput>(null);
  const colors = useColors();

  const containerStyles = [
    styles.container,
    { backgroundColor: colors.gray[50], borderColor: colors.gray[200] },
    isFocused && { borderColor: colors.primary, backgroundColor: colors.white },
    error && { borderColor: colors.danger },
    disabled && styles.disabled,
    multiline && styles.multiline,
    style,
  ];

  const inputStyles = [
    styles.input,
    { color: colors.gray[800] },
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
    multiline && styles.multilineInput,
  ];

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSubmitEditing = () => {
    if (onSubmitEditing) {
      onSubmitEditing();
    } else if (!multiline) {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.gray[700] }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
          {error && !required && ' *'}
        </Text>
      )}
      <View style={containerStyles}>
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={20}
            color={colors.gray[400]}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={inputRef}
          style={inputStyles}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={handleSubmitEditing}
          blurOnSubmit={!multiline}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye' : 'eye-off'}
              size={20}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <MaterialCommunityIcons
              name={rightIcon as any}
              size={20}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.6,
  },
  multiline: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.xl,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  multilineInput: {
    height: 'auto',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    textAlignVertical: 'top',
  },
  leftIcon: {
    paddingLeft: spacing.lg,
  },
  rightIcon: {
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
