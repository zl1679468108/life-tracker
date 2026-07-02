import { create } from 'zustand';
import { api } from '../lib/api';
import { LifeCategory } from '../types';
import { cache } from '../lib/cache';
import { networkMonitor } from '../lib/network';
import { socketService } from '../lib/socket';

const CATEGORIES_CACHE_KEY = 'categories';

interface CategoryState {
  categories: LifeCategory[];
  loading: boolean;
  error: string | null;
  loadedScope: 'all' | 'item' | 'todo' | null;
  fetchCategories: (type?: 'item' | 'todo', force?: boolean) => Promise<void>;
  addCategory: (category: Omit<LifeCategory, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<LifeCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  loadedScope: null,
  clearError: () => set({ error: null }),
  fetchCategories: async (type, force = false) => {
    const requestedScope = type || 'all';
    // 防止错误复用不同作用域的数据，例如先加载 todo 再进入 item 页面。
    if (!force && get().loadedScope === requestedScope && get().categories.length > 0 && !get().error) return;
    if (get().loading) return;
    set({ loading: true, error: null });
    
    // 离线模式：优先从缓存加载
    if (!networkMonitor.isOnline()) {
      const cached = await cache.get<LifeCategory[]>(CATEGORIES_CACHE_KEY);
      if (cached) {
        const filtered = type ? cached.filter(c => c.type === type) : cached;
        set({ categories: filtered, loading: false, loadedScope: requestedScope });
        return;
      }
    }
    
    try {
      const response = await api.categories.list();
      const allCategories = Array.isArray(response?.data) ? response.data : [];
      const visibleCategories = type ? allCategories.filter((c) => c.type === type) : allCategories;
      set({ categories: visibleCategories, loading: false, loadedScope: requestedScope });
      await cache.set(CATEGORIES_CACHE_KEY, allCategories);
    } catch (error) {
      // 网络错误时尝试从缓存加载
      if (!networkMonitor.isOnline()) {
        const cached = await cache.get<LifeCategory[]>(CATEGORIES_CACHE_KEY);
        if (cached) {
          const filtered = type ? cached.filter(c => c.type === type) : cached;
          set({ categories: filtered, loading: false, loadedScope: requestedScope });
          return;
        }
      }
      
      set({ error: (error as Error).message, loading: false, loadedScope: null });
    }
  },
  addCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      const response = await api.categories.create(category);
      if (!response?.data || response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '创建分类失败');
      }
      const data = response.data;
      set((state) => ({
        categories: state.categories.find((existing) => existing.id === data.id)
          ? state.categories.map((existing) => (existing.id === data.id ? data : existing))
          : [...state.categories, data],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  updateCategory: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.categories.update(id, updates);
      if (!response?.data || response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '更新分类失败');
      }
      const data = response.data;
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates, ...data } : c)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.categories.delete(id);
      if (response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '删除分类失败');
      }
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));

// 监听 socket 事件
socketService.onCategoryCreated((category) => {
  const currentCategories = useCategoryStore.getState().categories;
  const existing = currentCategories.find((c) => c.id === category.id);
  useCategoryStore.setState({
    categories: existing
      ? currentCategories.map((c) => (c.id === category.id ? category : c))
      : [...currentCategories, category],
  });
});

socketService.onCategoryDeleted(({ id }) => {
  useCategoryStore.setState((state) => ({
    categories: state.categories.filter(c => c.id !== id),
  }));
});
