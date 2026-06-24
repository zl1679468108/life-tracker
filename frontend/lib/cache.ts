import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

export const cache = {
  /**
   * 设置缓存
   */
  set: async (key: string, data: any): Promise<void> => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * 获取缓存
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // 检查缓存是否过期
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * 删除缓存
   */
  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  /**
   * 清空所有缓存
   */
  clear: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  /**
   * 检查缓存是否存在且有效
   */
  has: async (key: string): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return false;

      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp <= CACHE_EXPIRY;
    } catch (error) {
      return false;
    }
  },
};
