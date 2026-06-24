import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuthStore();
  const colors = useColors();
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
    // 验证输入
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
      
      // 延迟后跳转到登录页
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
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>修改密码</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
            {/* 当前密码 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray[700] }]}>当前密码</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.gray[50], borderColor: colors.gray[200] }]}>
                <TextInput
                  style={[styles.input, { color: colors.gray[800] }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="输入当前密码"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <MaterialCommunityIcons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 新密码 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray[700] }]}>新密码</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.gray[50], borderColor: colors.gray[200] }]}>
                <TextInput
                  style={[styles.input, { color: colors.gray[800] }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="输入新密码（至少6位）"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <MaterialCommunityIcons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 确认新密码 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.gray[700] }]}>确认新密码</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.gray[50], borderColor: colors.gray[200] }]}>
                <TextInput
                  style={[styles.input, { color: colors.gray[800] }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="再次输入新密码"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.gray[100] }]} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.cancelBtnText, { color: colors.gray[600] }]}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
            onPress={handleSave} 
            activeOpacity={0.7}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    padding: spacing.md,
  },
  eyeButton: {
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  cancelBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  saveBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
});
