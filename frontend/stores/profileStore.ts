import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { LifeProfile } from '../types';

const AVATAR_CACHE_KEY = 'user_avatar_url';
const AVATAR_DATA_CACHE_KEY = 'user_avatar_data_uri';

const toDataUri = async (avatarUrl: string) => {
  const response = await fetch(avatarUrl);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('头像转换失败'));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
};

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
      const cachedDataUri = await AsyncStorage.getItem(AVATAR_DATA_CACHE_KEY);
      if (cached) set({ cachedAvatarUrl: cached });
      if (cachedDataUri) {
        set((state) => ({
          profile: state.profile ? { ...state.profile, avatar_url: cachedDataUri } : state.profile,
        }));
      }
    } catch {}
  },
  /** 清除缓存（登出时调用） */
  clearCache: async () => {
    try {
      await AsyncStorage.removeItem(AVATAR_CACHE_KEY);
      await AsyncStorage.removeItem(AVATAR_DATA_CACHE_KEY);
    } catch {}
    set({ profile: null, cachedAvatarUrl: null });
  },
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.auth.getProfile();
      let profile = response.data;
      if (profile?.avatar_url && profile.avatar_url.startsWith('http')) {
        const cachedUrl = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
        const cachedDataUri = await AsyncStorage.getItem(AVATAR_DATA_CACHE_KEY);
        if (cachedUrl === profile.avatar_url && cachedDataUri) {
          profile = { ...profile, avatar_url: cachedDataUri };
        } else {
          const dataUri = await toDataUri(profile.avatar_url);
          await AsyncStorage.setItem(AVATAR_CACHE_KEY, profile.avatar_url);
          await AsyncStorage.setItem(AVATAR_DATA_CACHE_KEY, dataUri);
          profile = { ...profile, avatar_url: dataUri };
          set({ cachedAvatarUrl: profile.avatar_url });
        }
      }
      set({ profile, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.auth.updateProfile(updates);
      let profile = response.data;
      // 更新缓存的头像 URL
      if (updates.avatar_url) {
        await AsyncStorage.setItem(AVATAR_CACHE_KEY, updates.avatar_url);
        set({ cachedAvatarUrl: updates.avatar_url });
        if (updates.avatar_url.startsWith('http')) {
          const dataUri = await toDataUri(updates.avatar_url);
          await AsyncStorage.setItem(AVATAR_DATA_CACHE_KEY, dataUri);
          profile = { ...profile, avatar_url: dataUri };
        } else {
          await AsyncStorage.removeItem(AVATAR_DATA_CACHE_KEY);
        }
      }
      set((state) => ({ profile: state.profile ? { ...state.profile, ...profile } : profile, loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
