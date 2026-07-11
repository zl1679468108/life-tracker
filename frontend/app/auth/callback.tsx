import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string; error?: string }>();
  const { handleOAuthCallback } = useAuthStore();
  const colors = useColors();

  useEffect(() => {
    const handleCallback = async () => {
      const { access_token, refresh_token, error } = params;

      // Web 端：清理 URL 中的 token 参数，避免泄露到历史记录或地址栏
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // 检查是否有错误
      if (error) {
        console.error('OAuth error:', error);
        router.replace('/auth/login');
        return;
      }

      if (access_token && refresh_token) {
        try {
          // 使用 token 设置 Supabase session
          await handleOAuthCallback(access_token, refresh_token);
          router.replace('/(tabs)');
        } catch (err) {
          console.error('Failed to set session:', err);
          router.replace('/auth/login');
        }
      } else {
        // 缺少必要的 token，返回登录页
        console.error('Missing tokens in callback');
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.gray[600] }]}>正在完成登录...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
