import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { LifeProfile } from '../types';

const AVATAR_CACHE_KEY = 'user_avatar_url';
const AVATAR_DATA_CACHE_KEY = 'user_avatar_data_uri';

/** 将远程图片 URL 转换为 Base64 data URI（跨平台：Web 和 React Native 均支持 FileReader） */
const toDataUri = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('头像转换失败'));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
};

/** 是否 Base64 data URI */
const isDataUri = (v: string) => v.startsWith('data:');

interface ProfileState {
  profile: LifeProfile | null;
  /** 原始头像 URL，用于检测变更 */
  cachedAvatarUrl: string | null;
  /** Base64 data URI，用于无网络渲染 */
  avatarDataUri: string | null;
  /** 是否正在转换头像 */
  avatarConverting: boolean;
  loading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<LifeProfile>) => Promise<void>;
  initCachedAvatar: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  cachedAvatarUrl: null,
  avatarDataUri: null,
  avatarConverting: false,
  loading: false,
  error: null,

  initCachedAvatar: async () => {
    try {
      const [cachedUrl, cachedDataUri] = await Promise.all([
        AsyncStorage.getItem(AVATAR_CACHE_KEY),
        AsyncStorage.getItem(AVATAR_DATA_CACHE_KEY),
      ]);
      set({
        cachedAvatarUrl: cachedUrl || null,
        avatarDataUri: cachedDataUri || null,
      });
    } catch {
      // 静默失败，后续 fetchProfile 会补回
    }
  },

  clearCache: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AVATAR_CACHE_KEY),
        AsyncStorage.removeItem(AVATAR_DATA_CACHE_KEY),
      ]);
    } catch {}
    set({ profile: null, cachedAvatarUrl: null, avatarDataUri: null });
  },

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.auth.getProfile();
      const profile = response.data;
      const { cachedAvatarUrl, avatarDataUri, avatarConverting } = get();

      if (profile?.avatar_url) {
        // 如果 avatar_url 已经是 data URI，直接存储
        if (isDataUri(profile.avatar_url)) {
          set({
            profile,
            cachedAvatarUrl: null,
            avatarDataUri: profile.avatar_url,
            loading: false,
          });
          return;
        }

        // avatar_url 是 HTTP URL
        if (avatarConverting) {
          // 有并发转换进行中，先返回已有缓存
          set({ profile: { ...profile, avatar_url: avatarDataUri || profile.avatar_url }, loading: false });
          return;
        }

        const sameUrl = cachedAvatarUrl === profile.avatar_url;
        if (sameUrl && avatarDataUri) {
          // URL 未变，使用缓存的 Base64
          set({
            profile: { ...profile, avatar_url: avatarDataUri },
            loading: false,
          });
          return;
        }

        // URL 变了或没有缓存，重新转换
        set({ avatarConverting: true });
        try {
          const dataUri = await toDataUri(profile.avatar_url);
          await Promise.all([
            AsyncStorage.setItem(AVATAR_CACHE_KEY, profile.avatar_url),
            AsyncStorage.setItem(AVATAR_DATA_CACHE_KEY, dataUri),
          ]);
          set({
            profile: { ...profile, avatar_url: dataUri },
            cachedAvatarUrl: profile.avatar_url,
            avatarDataUri: dataUri,
            avatarConverting: false,
            loading: false,
          });
        } catch (convertError) {
          // Base64 转换失败时，退回到原始 URL
          set({
            profile,
            cachedAvatarUrl: profile.avatar_url,
            avatarDataUri: null,
            avatarConverting: false,
            loading: false,
          });
        }
      } else {
        // 没有头像
        set({ profile, loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.auth.updateProfile(updates);
      const profile = response.data;

      // 头像更新处理
      if (updates.avatar_url) {
        await AsyncStorage.setItem(AVATAR_CACHE_KEY, updates.avatar_url);
        set({ cachedAvatarUrl: updates.avatar_url });

        if (isDataUri(updates.avatar_url)) {
          // 本地选择的新头像已经是 data URI
          await AsyncStorage.setItem(AVATAR_DATA_CACHE_KEY, updates.avatar_url);
          set({ avatarDataUri: updates.avatar_url });
        } else if (updates.avatar_url.startsWith('http')) {
          // 远程 URL，转换为 Base64
          try {
            const dataUri = await toDataUri(updates.avatar_url);
            await AsyncStorage.setItem(AVATAR_DATA_CACHE_KEY, dataUri);
            set({ avatarDataUri: dataUri });
            profile.avatar_url = dataUri;
          } catch {
            // 转换失败，保留原始 URL
          }
        } else {
          // 其他情况（空字符串等），清除缓存
          await AsyncStorage.removeItem(AVATAR_DATA_CACHE_KEY);
          set({ avatarDataUri: null });
        }
      }

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...profile } : profile,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
