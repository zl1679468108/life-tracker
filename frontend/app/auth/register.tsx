import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Input, Button } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../lib/alert';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuthStore();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) return;
    if (password !== confirmPassword) {
      showAlert('提示', '两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      showAlert('注册成功', '请查收验证邮件完成注册', [
        { text: '确定', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (error: any) {
      showAlert('注册失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen backgroundColor={colors.white}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.white }]}
        behavior="height"
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray[100] }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.gray[700]} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[...colors.primaryGradient]}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="account-plus" size={40} color={colors.white} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.gray[900] }]}>创建账号</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>注册以开始使用 LifeTracker</Text>

          <View style={styles.form}>
            <Input
              label="邮箱"
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱地址"
              leftIcon="email-outline"
              keyboardType="email-address"
              returnKeyType="next"
              required
            />

            <Input
              label="密码"
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码（至少6位）"
              secureTextEntry={!showPassword}
              leftIcon="lock-outline"
              returnKeyType="next"
              required
            />

            <Input
              label="确认密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="请再次输入密码"
              secureTextEntry={!showPassword}
              leftIcon="lock-outline"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              required
            />

            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={[styles.loadingIndicator, { borderColor: colors.white, borderTopColor: 'transparent' }]} />
              ) : (
                <Text style={[styles.registerBtnText, { color: colors.white }]}>注册</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.gray[500] }]}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.loginText, { color: colors.primary }]}>返回登录</Text>
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
    paddingTop: spacing['3xl'],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
  registerBtn: {
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
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
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
  loginText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});
