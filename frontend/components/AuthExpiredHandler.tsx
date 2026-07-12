import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { authSession } from '../lib/authSession';
import { setAuthToken, setRefreshToken } from '../lib/token';
import { useAuthStore } from '../stores/authStore';
import { showAlert } from '../lib/alert';

export function AuthExpiredHandler() {
  const router = useRouter();
  const handlingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = authSession.onExpired(async () => {
      if (handlingRef.current) return;
      handlingRef.current = true;

      // 长 token 也失效，清除所有 token
      await setAuthToken(null);
      await setRefreshToken(null);
      useAuthStore.setState({ user: null, loading: false });

      showAlert('身份已过期', '登录已失效，请重新登录', [
        { text: '取消', style: 'cancel', onPress: () => { handlingRef.current = false; } },
        {
          text: '去登录',
          style: 'destructive',
          onPress: () => {
            handlingRef.current = false;
            router.replace('/auth/login');
          },
        },
      ]);
    });
    return () => { unsubscribe(); };
  }, [router]);

  return null;
}
