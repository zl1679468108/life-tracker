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
  fetchCategories: (type?: 'item' | 'todo', force?: boolean) => Promise<void>;
  addCategory: (category: Omit<LifeCategory, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<LifeCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  fetchCategories: async (type, force = false) => {
    // 防止重复请求：已有数据且非强制刷新时跳过
    if (!force && get().categories.length > 0 && !get().error) return;
    if (get().loading) return;
    set({ loading: true, error: null });
    
    // 离线模式：优先从缓存加载
    if (!networkMonitor.isOnline()) {
      const cached = await cache.get<LifeCategory[]>(CATEGORIES_CACHE_KEY);
      if (cached) {
        const filtered = type ? cached.filter(c => c.type === type) : cached;
        set({ categories: filtered, loading: false });
        return;
      }
    }
    
    try {
      const data = await api.categories.list(type);
      const categories = data || [];
      set({ categories, loading: false });
      
      // 缓存所有分类（不按类型过滤）
      const allData = await api.categories.list();
      await cache.set(CATEGORIES_CACHE_KEY, allData || []);
    } catch (error) {
      // 网络错误时尝试从缓存加载
      if (!networkMonitor.isOnline()) {
        const cached = await cache.get<LifeCategory[]>(CATEGORIES_CACHE_KEY);
        if (cached) {
          const filtered = type ? cached.filter(c => c.type === type) : cached;
          set({ categories: filtered, loading: false });
          return;
        }
      }
      
      set({ error: (error as Error).message, loading: false });
    }
  },
  addCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      const data = await api.categories.create(category);
      set((state) => ({ categories: [...state.categories, data], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  updateCategory: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await api.categories.update(id, updates);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.categories.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

// 监听 socket 事件
socketService.onCategoryCreated((category) => {
  const currentCategories = useCategoryStore.getState().categories;
  if (!currentCategories.find(c => c.id === category.id)) {
    useCategoryStore.setState({ categories: [...currentCategories, category] });
  }
});

socketService.onCategoryDeleted(({ id }) => {
  useCategoryStore.setState((state) => ({
    categories: state.categories.filter(c => c.id !== id),
  }));
});
