import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { AppScreen, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../lib/alert';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; type?: string }>();
  const { updatePassword } = useAuthStore();
  const colors = useColors();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    Keyboard.dismiss();
    
    const { token, type } = params;
    
    if (!token || type !== 'reset') {
      showAlert('错误', '无效的重置链接');
      return;
    }

    if (!password.trim()) {
      showAlert('提示', '请输入新密码');
      return;
    }

    if (password.length < 6) {
      showAlert('提示', '密码至少需要6位');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('提示', '两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password, token);
      showAlert('密码已更新', '您的密码已成功重置', [
        { text: '去登录', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (error: any) {
      showAlert('更新失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll={false} padded={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.gray[50] }]}
        behavior="height"
      >
        <ScrollView
          style={{ backgroundColor: colors.gray[50] }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[...colors.primaryGradient]}
              style={[styles.logo, { shadowColor: colors.primary }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="lock-reset" size={40} color={colors.white} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.gray[900] }]}>设置新密码</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>请输入您的新密码</Text>

          <View style={styles.form}>
            <Input
              label="新密码"
              value={password}
              onChangeText={setPassword}
              placeholder="请输入新密码（至少6位）"
              secureTextEntry={!showPassword}
              leftIcon="lock-outline"
              returnKeyType="next"
              required
            />

            <Input
              label="确认密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="请再次输入新密码"
              secureTextEntry={!showPassword}
              leftIcon="lock-outline"
              returnKeyType="done"
              onSubmitEditing={handleUpdate}
              required
            />

            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.updateBtnDisabled]}
              onPress={handleUpdate}
              disabled={loading || !password.trim() || !confirmPassword.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={[styles.loadingIndicator, { borderColor: colors.white }]} />
              ) : (
                <Text style={[styles.updateBtnText, { color: colors.white }]}>更新密码</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={[styles.loginText, { color: colors.primary }]}>返回登录</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl * 1.6,
    paddingTop: spacing['3xl'] * 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: fontSize['8xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  form: {
    marginBottom: spacing['2xl'],
  },
  updateBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  updateBtnDisabled: {
    opacity: 0.7,
  },
  updateBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  loginText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});
