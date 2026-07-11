import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const META_PREFIX = 'cache_meta_';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24小时

// 按数据类型设不同 TTL：频繁变动的数据短 TTL，相对稳定的数据长 TTL
const TTL_BY_PREFIX: Record<string, number> = {
  items: 5 * 60 * 1000,              // 物品列表：5 分钟
  todos: 5 * 60 * 1000,              // 待办列表：5 分钟
  categories: 24 * 60 * 60 * 1000,   // 分类：24 小时
  locations: 24 * 60 * 60 * 1000,    // 位置：24 小时
};

function getTtlForKey(key: string): number {
  for (const prefix of Object.keys(TTL_BY_PREFIX)) {
    if (key.startsWith(prefix)) return TTL_BY_PREFIX[prefix];
  }
  return DEFAULT_TTL;
}

export const cache = {
  /**
   * 设置缓存
   * @param key 缓存键（按前缀自动匹配 TTL）
   * @param data 缓存数据
   * @param ttl 可选自定义 TTL（毫秒），不传则按 key 前缀匹配
   */
  set: async (key: string, data: any, ttl?: number): Promise<void> => {
    try {
      const actualTtl = ttl ?? getTtlForKey(key);
      const timestamp = Date.now();
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, timestamp, ttl: actualTtl }));
      // 额外存轻量元数据，供 has 快速检查，避免反序列化整个 data
      await AsyncStorage.setItem(`${META_PREFIX}${key}`, JSON.stringify({ timestamp, ttl: actualTtl }));
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

      const { data, timestamp, ttl } = JSON.parse(cached);
      const actualTtl = ttl ?? DEFAULT_TTL; // 向后兼容旧缓存（无 ttl 字段）

      // 检查缓存是否过期
      if (Date.now() - timestamp > actualTtl) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        await AsyncStorage.removeItem(`${META_PREFIX}${key}`);
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
      await AsyncStorage.removeItem(`${META_PREFIX}${key}`);
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
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX) || key.startsWith(META_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  /**
   * 检查缓存是否存在且有效
   * 仅读取轻量元数据，避免反序列化整个 data
   */
  has: async (key: string): Promise<boolean> => {
    try {
      const meta = await AsyncStorage.getItem(`${META_PREFIX}${key}`);
      if (meta) {
        const { timestamp, ttl } = JSON.parse(meta);
        return Date.now() - timestamp <= ttl;
      }
      // 向后兼容：旧缓存无元数据，回退到读取主 key
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return false;
      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp <= DEFAULT_TTL;
    } catch (error) {
      return false;
    }
  },
};
