import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { authSession } from '../lib/authSession';
import { setAuthToken } from '../lib/token';
import { useAuthStore } from '../stores/authStore';
import { showAlert } from '../lib/alert';

export function AuthExpiredHandler() {
  const router = useRouter();
  const handlingRef = useRef(false);

  useEffect(() => {
    return authSession.onExpired(async () => {
      if (handlingRef.current) return;
      handlingRef.current = true;

      await setAuthToken(null);
      useAuthStore.setState({ user: null, loading: false });

      showAlert('身份已过期', '请重新登录后继续使用', [
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
  }, [router]);

  return null;
}
