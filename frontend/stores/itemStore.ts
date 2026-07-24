import { create } from 'zustand';
import { api, assertApiOk } from '../lib/api';
import { uploadImages } from '../lib/upload';
import { useAuthStore } from './authStore';
import { LifeItem, UpdateItemReminderRequest } from '../types';
import { cache } from '../lib/cache';
import { networkMonitor } from '../lib/network';
import { socketService } from '../lib/socket';

const ITEMS_CACHE_KEY = 'items';
// 请求竞态守卫：仅接受最后一次 fetch 的结果
let fetchItemsRequestId = 0;

interface ItemState {
  items: LifeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<LifeItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<LifeItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItemReminder: (id: string, data: UpdateItemReminderRequest) => Promise<void>;
  clearError: () => void;
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  fetchItems: async () => {
    const requestId = ++fetchItemsRequestId;
    const currentItems = useItemStore.getState().items;
    set({ loading: currentItems.length === 0, error: null });

    // 离线模式：优先从缓存加载
    if (!networkMonitor.isOnline()) {
      const cached = await cache.get<LifeItem[]>(ITEMS_CACHE_KEY);
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchItemsRequestId) return;
      if (cached) {
        set({ items: cached, loading: false });
        return;
      }
    }

    try {
      const response = await api.items.list();
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchItemsRequestId) return;
      const items = Array.isArray(response?.data) ? response.data : [];
      set({ items, loading: false });

      // 缓存数据
      await cache.set(ITEMS_CACHE_KEY, items);
    } catch (error) {
      console.error('fetchItems error:', error);
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchItemsRequestId) return;

      // 网络错误时尝试从缓存加载
      if (!networkMonitor.isOnline()) {
        const cached = await cache.get<LifeItem[]>(ITEMS_CACHE_KEY);
        if (requestId !== fetchItemsRequestId) return;
        if (cached) {
          set({ items: cached, loading: false });
          return;
        }
      }

      set({ error: (error as Error).message, loading: false });
    }
  },
  addItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('未登录');
      
      // 上传图片
      let uploadedImages: string[] = [];
      if (item.images && item.images.length > 0) {
        uploadedImages = await uploadImages(item.images, user.id);
      }
      
      // 创建物品
      const response = await api.items.create({
        ...item,
        images: uploadedImages,
      });
      if (!response?.data || response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '创建物品失败');
      }
      const data = response.data;
      
      set((state) => ({
        items: state.items.find((existing) => existing.id === data.id)
          ? state.items.map((existing) => (existing.id === data.id ? data : existing))
          : [data, ...state.items],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  updateItem: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('未登录');
      
      // 上传新图片
      let uploadedImages = updates.images;
      if (updates.images && updates.images.length > 0) {
        // 过滤出本地图片（不是 URL 的）
        const localImages = updates.images.filter(img => !img.startsWith('http'));
        const existingImages = updates.images.filter(img => img.startsWith('http'));
        
        if (localImages.length > 0) {
          const newUrls = await uploadImages(localImages, user.id);
          uploadedImages = [...existingImages, ...newUrls];
        }
      }
      
      const response = await api.items.update(id, { ...updates, images: uploadedImages });
      if (!response?.data || response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '更新物品失败');
      }
      set((state) => ({ 
        items: state.items.map((item) => 
          item.id === id ? { ...item, ...updates, images: uploadedImages } : item
        ), 
        loading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      assertApiOk(await api.items.delete(id), '删除物品失败');
      set((state) => ({ items: state.items.filter((item) => item.id !== id), loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  updateItemReminder: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.items.update(id, {
        reminder_enabled: data.enabled,
        reminder_days_before: data.reminder_days_before,
      });
      set((state) => ({ 
        items: state.items.map((item) => 
          item.id === id ? { ...item, reminder_enabled: data.enabled, reminder_days_before: data.reminder_days_before } : item
        ), 
        loading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));

// 监听 socket 事件
socketService.onItemCreated((item) => {
  const currentItems = useItemStore.getState().items;
  const existing = currentItems.find((i) => i.id === item.id);
  useItemStore.setState({
    items: existing
      ? currentItems.map((i) => (i.id === item.id ? item : i))
      : [item, ...currentItems],
  });
});

socketService.onItemUpdated((item) => {
  useItemStore.setState((state) => ({
    items: state.items.map(i => i.id === item.id ? item : i),
  }));
});

socketService.onItemDeleted(({ id }) => {
  useItemStore.setState((state) => ({
    items: state.items.filter(i => i.id !== id),
  }));
});
