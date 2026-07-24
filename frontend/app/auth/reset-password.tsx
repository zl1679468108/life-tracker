import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { AppScreen, Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../lib/alert';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    Keyboard.dismiss();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await resetPassword(email.trim());
      showAlert('邮件已发送', '请查收邮箱重置密码', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      showAlert('发送失败', error.message || '请稍后重试');
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
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.gray[100] }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.gray[700]} />
          </TouchableOpacity>

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

          <Text style={[styles.title, { color: colors.gray[900] }]}>重置密码</Text>
          <Text style={[styles.subtitle, { color: colors.gray[500] }]}>输入注册邮箱，我们将发送密码重置链接</Text>

          <View style={styles.form}>
            <Input
              label="邮箱"
              value={email}
              onChangeText={setEmail}
              placeholder="请输入注册邮箱"
              leftIcon="email-outline"
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleReset}
              required
            />

            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.resetBtnDisabled]}
              onPress={handleReset}
              disabled={loading || !email.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={[styles.loadingIndicator, { borderColor: colors.white }]} />
              ) : (
                <Text style={[styles.resetBtnText, { color: colors.white }]}>发送重置链接</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()}>
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
  resetBtn: {
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
  resetBtnDisabled: {
    opacity: 0.7,
  },
  resetBtnText: {
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
