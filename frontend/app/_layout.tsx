import 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, ActivityIndicator, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { ThemeProvider } from '../components/ThemeProvider';
import { useTheme, useColors, useThemeStore } from '../stores/themeStore';
import { i18n } from '../lib/i18n';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthExpiredHandler } from '../components/AuthExpiredHandler';
import { AppAlertHost } from '../components/AppAlertHost';
import { addNotificationListeners } from '../lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments();
  const { user, loading, init } = useAuthStore();
  const { isDark } = useTheme();
  const colors = useColors();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    init();
    initTheme();
    i18n.init();

    // Web 平台注册 Service Worker 开启深度离线 PWA 缓存
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
          console.log('ServiceWorker registration successful with scope: ', reg.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  // 处理推送通知点击（原生平台）
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web 端：监听浏览器通知点击
      const handleClick = (event: Event) => {
        const notification = (event as Event & { notification?: Notification }).notification;
        if (notification?.data?.link) {
          router.push(notification.data.link as any);
        }
      };
      // 注意：Web Notification API 的 click 事件需要通过 Service Worker 或全局监听
      // 这里主要通过通知中心页面处理
      return;
    }

    const cleanup = addNotificationListeners(
      undefined, // 不处理收到通知（本地处理）
      (notification: any) => {
        // 尝试从 notification.data 中获取深度链接
        const link = notification?.content?.data?.link;
        if (link) {
          router.push(link as any);
        }
      }
    );

    return cleanup;
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (loading || !loaded) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      const timer = setTimeout(() => router.replace('/auth/login'), 100);
      return () => clearTimeout(timer);
    } else if (user && inAuthGroup) {
      const timer = setTimeout(() => router.replace('/(tabs)'), 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, loaded, segments]);

  if (!loaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 根据主题动态配置
  const paperTheme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: darkColors.primary,
          secondary: darkColors.secondary,
          background: darkColors.gray[50],
          surface: darkColors.white,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: colors.primary,
          secondary: colors.secondary,
          background: colors.gray[50],
          surface: colors.white,
        },
      };

  const subPageOptions = {
    headerShown: true as const,
    headerTitleAlign: 'center' as const,
    headerStyle: { backgroundColor: colors.white, elevation: 0, shadowOpacity: 0 },
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17, color: colors.gray[900] },
    headerLeft: () => (
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.gray[800]} />
      </TouchableOpacity>
    ),
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <PaperProvider theme={paperTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <AuthExpiredHandler />
            <AppAlertHost />
            <Stack screenOptions={{ contentStyle: { backgroundColor: colors.gray[50] } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="message/[id]" options={{ ...subPageOptions, headerTitle: '对话详情' }} />
            <Stack.Screen name="item/create" options={{ ...subPageOptions, headerTitle: '添加物品' }} />
            <Stack.Screen name="item/[id]" options={{ ...subPageOptions, headerTitle: '编辑物品' }} />
            <Stack.Screen name="item/list" options={{ ...subPageOptions, headerTitle: '物品管理' }} />
            <Stack.Screen name="todo/create" options={{ ...subPageOptions, headerTitle: '添加待办' }} />
            <Stack.Screen name="todo/[id]" options={{ ...subPageOptions, headerTitle: '编辑待办' }} />
            <Stack.Screen name="todo/list" options={{ ...subPageOptions, headerTitle: '待办管理' }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="auth/update-password" options={{ headerShown: false }} />
            <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen name="settings/category-manage" options={{ ...subPageOptions, headerTitle: '物品分类' }} />
            <Stack.Screen name="settings/location-manage" options={{ ...subPageOptions, headerTitle: '存放位置' }} />
            <Stack.Screen name="settings/account" options={{ ...subPageOptions, headerTitle: '账号管理' }} />
            <Stack.Screen name="settings/feedback" options={{ ...subPageOptions, headerTitle: '反馈建议' }} />
            <Stack.Screen name="settings/stats" options={{ ...subPageOptions, headerTitle: '数据统计' }} />
            <Stack.Screen name="settings/notifications" options={{ ...subPageOptions, headerTitle: '通知中心' }} />
            <Stack.Screen name="settings/change-password" options={{ ...subPageOptions, headerTitle: '修改密码' }} />
            <Stack.Screen name="settings/theme" options={{ ...subPageOptions, headerTitle: '主题设置' }} />
            <Stack.Screen name="settings/language" options={{ ...subPageOptions, headerTitle: '语言' }} />
            <Stack.Screen name="settings/borrowings" options={{ ...subPageOptions, headerTitle: '借用管理' }} />
            <Stack.Screen name="settings/borrowing-create" options={{ ...subPageOptions, headerTitle: '新增借用' }} />
            <Stack.Screen name="settings/shares" options={{ ...subPageOptions, headerTitle: '共享管理' }} redirect />
            <Stack.Screen name="settings/templates" options={{ ...subPageOptions, headerTitle: '模板管理' }} />
            <Stack.Screen name="settings/data" options={{ ...subPageOptions, headerTitle: '数据管理' }} />
            <Stack.Screen name="settings/assets" options={{ ...subPageOptions, headerTitle: '资产总览' }} />
            <Stack.Screen name="settings/calendar" options={{ ...subPageOptions, headerTitle: '日历视图' }} />
            <Stack.Screen name="settings/widgets" options={{ ...subPageOptions, headerTitle: '桌面小组件' }} />
            </Stack>
          </PaperProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
