import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { SafeScreen } from '../../components/SafeScreen';
import { useAuthStore } from '../../stores/authStore';
import { showAlert } from '../../lib/alert';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; type?: string }>();
  const { verifyEmail } = useAuthStore();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleVerify = async () => {
      const { token, type } = params;
      
      if (!token || type !== 'signup') {
        setErrorMessage('无效的验证链接');
        setLoading(false);
        return;
      }

      try {
        await verifyEmail(token);
        setSuccess(true);
        showAlert('验证成功', '您的邮箱已验证，现在可以登录了', [
          { text: '去登录', onPress: () => router.replace('/auth/login') },
        ]);
      } catch (error: any) {
        setErrorMessage(error.message || '验证失败');
        showAlert('验证失败', error.message || '请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    handleVerify();
  }, [params]);

  return (
    <SafeScreen backgroundColor={colors.white}>
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        {loading ? (
          <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.gray[500] }]}>正在验证邮箱...</Text>
          </View>
        ) : success ? (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="check-circle" size={80} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.gray[900] }]}>邮箱验证成功</Text>
            <Text style={[styles.subtitle, { color: colors.gray[500] }]}>您的邮箱已成功验证，现在可以登录使用 LifeTracker</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="close-circle" size={80} color={colors.danger} />
            </View>
            <Text style={[styles.title, { color: colors.gray[900] }]}>验证失败</Text>
            <Text style={[styles.subtitle, { color: colors.gray[500] }]}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: fontSize.lg,
    marginTop: spacing.lg,
  },
});
