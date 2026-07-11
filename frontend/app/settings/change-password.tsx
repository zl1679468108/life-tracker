import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Toast } from '../../components/Toast';
import { AppScreen, FormActions } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  palette,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry: boolean;
  onToggleSecure: () => void;
  palette: typeof appDesign.dark;
}) {
  return (
    <View style={[styles.fieldCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
        <TextInput
          style={[styles.input, { color: palette.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textDisabled}
          secureTextEntry={secureTextEntry}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={onToggleSecure} activeOpacity={0.76}>
          <MaterialCommunityIcons
            name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={palette.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuthStore();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return '密码长度至少6位';
    }
    return null;
  };

  const handleSave = async () => {
    if (!currentPassword.trim()) {
      showToast('请输入当前密码', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showToast('请输入新密码', 'error');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('新密码不能与当前密码相同', 'error');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('密码修改成功，请重新登录', 'success');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 1500);
    } catch (error) {
      const errorMsg = (error as Error).message || '密码修改失败';
      showToast(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <PasswordField
            label="当前密码"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="输入当前密码"
            secureTextEntry={!showCurrentPassword}
            onToggleSecure={() => setShowCurrentPassword(!showCurrentPassword)}
            palette={palette}
          />
          <PasswordField
            label="新密码"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="输入新密码（至少 6 位）"
            secureTextEntry={!showNewPassword}
            onToggleSecure={() => setShowNewPassword(!showNewPassword)}
            palette={palette}
          />
          <PasswordField
            label="确认新密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="再次输入新密码"
            secureTextEntry={!showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
            palette={palette}
          />
        </View>
      </AppScreen>

      <View style={[styles.bottomBar, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
        <FormActions
          hideCancel
          onSubmit={handleSave}
          submitLabel={saving ? '保存中...' : '保存'}
          loading={false}
          disabled={saving}
          style={styles.formActions}
        />
      </View>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 132,
  },
  section: {
    marginBottom: spacing.lg,
  },
  fieldCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
  formActions: {
    marginTop: 0,
  },
});
