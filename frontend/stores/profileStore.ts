import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { LifeProfile } from '../types';

const AVATAR_CACHE_KEY = 'user_avatar_url';

interface ProfileState {
  profile: LifeProfile | null;
  /** 缓存的头像 URL，登录后立即从本地读取，无需等待 API */
  cachedAvatarUrl: string | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<LifeProfile>) => Promise<void>;
  /** 初始化：从本地缓存加载头像 URL */
  initCachedAvatar: () => Promise<void>;
  /** 清除缓存（登出时调用） */
  clearCache: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  cachedAvatarUrl: null,
  loading: false,
  error: null,
  initCachedAvatar: async () => {
    try {
      const cached = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
      if (cached) set({ cachedAvatarUrl: cached });
    } catch {}
  },
  /** 清除缓存（登出时调用） */
  clearCache: async () => {
    try {
      await AsyncStorage.removeItem(AVATAR_CACHE_KEY);
    } catch {}
    set({ profile: null, cachedAvatarUrl: null });
  },
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.auth.getProfile();
      set({ profile: data, loading: false });
      // 缓存头像 URL
      if (data?.avatar_url) {
        await AsyncStorage.setItem(AVATAR_CACHE_KEY, data.avatar_url);
        set({ cachedAvatarUrl: data.avatar_url });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const data = await api.auth.updateProfile(updates);
      set((state) => ({ profile: { ...state.profile, ...data }, loading: false }));
      // 更新缓存的头像 URL
      if (updates.avatar_url) {
        await AsyncStorage.setItem(AVATAR_CACHE_KEY, updates.avatar_url);
        set({ cachedAvatarUrl: updates.avatar_url });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
