import { create } from 'zustand';
import { api } from '../lib/api';
import { resetAuthExpiredState } from '../lib/api';
import { setAuthToken, getAuthToken } from '../lib/token';
import { socketService } from '../lib/socket';
import { useProfileStore } from './profileStore';
import { authSession } from '../lib/authSession';

interface User {
  id: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: string, redirectTo: string) => Promise<{ url: string }>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  init: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string, token: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    const data = await api.auth.signIn(email, password);
    const token = data.data?.token || null;
    await setAuthToken(token);
    resetAuthExpiredState();
    authSession.resetExpired();
    set({ user: data.data?.user || null, loading: false });
    // 连接 socket
    if (data.data?.user) {
      socketService.connect(data.data.user.id);
    }
  },
  signUp: async (email, password) => {
    const data = await api.auth.signUp(email, password);
    const token = data.data?.token || null;
    await setAuthToken(token);
    resetAuthExpiredState();
    authSession.resetExpired();
    set({ user: data.data?.user || null, loading: false });
    // 连接 socket
    if (data.data?.user) {
      socketService.connect(data.data.user.id);
    }
  },
  signInWithOAuth: async (provider, redirectTo) => {
    // 调用后端 API 获取 OAuth URL
    const data = await api.auth.signInWithOAuth(provider, redirectTo);
    return { url: data.url };
  },
  handleOAuthCallback: async (accessToken, refreshToken) => {
    // 设置 token
    await setAuthToken(accessToken);
    resetAuthExpiredState();
    authSession.resetExpired();
    
    // 调用后端 API 获取用户信息
    try {
      const profile = await api.auth.getProfile();
      if (profile?.data) {
        set({ user: { id: profile.data.id, email: profile.data.email || undefined }, loading: false });
        // 连接 socket
        socketService.connect(profile.data.id);
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
      // 如果获取 profile 失败，清除 token
      await setAuthToken(null);
      set({ loading: false });
      throw error;
    }
  },
  signOut: async () => {
    // 断开 socket 连接
    socketService.disconnect();
    // 清除头像缓存
    await useProfileStore.getState().clearCache();
    // TODO: 调用后端登出 API
    await setAuthToken(null);
    set({ user: null, loading: false });
  },
  setUser: (user) => {
    set({ user, loading: false });
    // 连接 socket
    if (user) {
      socketService.connect(user.id);
    } else {
      socketService.disconnect();
    }
  },
  init: async () => {
    // 从本地存储恢复用户会话
    const token = await getAuthToken();
    if (token) {
      try {
        // 用 token 获取用户信息，恢复 user 状态
        const profile = await api.auth.getProfile();
        if (profile?.data) {
          resetAuthExpiredState();
          authSession.resetExpired();
          set({ user: { id: profile.data.id, email: profile.data.email || undefined }, loading: false });
          socketService.connect(profile.data.id);
        } else {
          set({ loading: false });
        }
      } catch {
        // token 无效，清除
        await setAuthToken(null);
        set({ user: null, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },
  resetPassword: async (email) => {
    await api.auth.resetPassword(email);
  },
  updatePassword: async (password, token) => {
    await api.auth.updatePassword(password, token);
  },
  verifyEmail: async (token) => {
    await api.auth.verifyEmail(token);
  },
  changePassword: async (currentPassword, newPassword) => {
    await api.auth.changePassword(currentPassword, newPassword);
    // 修改成功后清除 token，强制重新登录
    await setAuthToken(null);
    set({ user: null, loading: false });
  },
}));
