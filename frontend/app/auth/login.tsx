import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Input, Button } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../lib/alert';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert('登录失败', error.message || '请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen backgroundColor={colors.gray[50]}>
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
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="check-circle" size={40} color={colors.white} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.gray[900] }]}>欢迎回来</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>登录以继续使用 LifeTracker</Text>

          <View style={styles.form}>
            <Input
              label="邮箱 / 手机号"
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱或手机号"
              leftIcon="email-outline"
              keyboardType="email-address"
              returnKeyType="next"
              required
            />

            <Input
              label="密码"
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码"
              secureTextEntry={!showPassword}
              leftIcon="lock-outline"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              required
            />

            <View style={styles.formRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked, { borderColor: colors.gray[300] }, rememberMe && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {rememberMe && (
                    <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                  )}
                </View>
                <Text style={[styles.checkboxText, { color: colors.gray[600] }]}>记住我</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/auth/reset-password')}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>忘记密码？</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading || !email.trim() || !password.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={[styles.loadingIndicator, { borderColor: colors.white, borderTopColor: 'transparent' }]} />
              ) : (
                <Text style={[styles.loginBtnText, { color: colors.white }]}>登录</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.authHint, { color: colors.gray[500] }]}>当前版本仅开放邮箱密码登录。</Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.gray[500] }]}>还没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={[styles.registerText, { color: colors.primary }]}>立即注册</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
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
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
  },
  checkboxChecked: {},
  checkboxText: {
    fontSize: fontSize.base,
  },
  forgotText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  loginBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
  },
  authHint: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: fontSize.lg,
  },
  registerText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});
