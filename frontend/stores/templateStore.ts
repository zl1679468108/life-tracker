import { create } from 'zustand';
import { api, assertApiOk, assertApiData } from '../lib/api';
import { LifeTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '../types';

interface TemplateState {
  templates: LifeTemplate[];
  loading: boolean;
  error: string | null;
  // 当前已加载的模板类型，防止 item/todo 列表互相覆盖
  loadedType: 'item' | 'todo' | 'all' | null;
  fetchTemplates: (type?: 'item' | 'todo', force?: boolean) => Promise<void>;
  createTemplate: (data: CreateTemplateRequest) => Promise<void>;
  useTemplate: (id: string, overrides?: Record<string, any>) => Promise<string>;
  updateTemplate: (id: string, data: UpdateTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,
  loadedType: null,

  fetchTemplates: async (type?: 'item' | 'todo', force = false) => {
    const requestedType = type || 'all';
    // 防止错误复用不同 type 的数据，例如先加载 todo 再进入 item 页面
    if (!force && get().loadedType === requestedType && get().templates.length > 0 && !get().error) return;
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await api.templates.list(type);
      if (res.data) {
        set({ templates: res.data, loading: false, loadedType: requestedType });
      } else {
        set({ error: res.message || '获取模板列表失败', loading: false, loadedType: null });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false, loadedType: null });
    }
  },

  createTemplate: async (data: CreateTemplateRequest) => {
    set({ loading: true, error: null });
    try {
      const created = assertApiData(await api.templates.create(data), '创建模板失败');
      set((state) => ({
        templates: [created, ...state.templates],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  useTemplate: async (id: string, overrides?: Record<string, any>) => {
    set({ loading: true, error: null });
    try {
      const used = assertApiData(await api.templates.use(id, overrides), '使用模板失败');
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, usage_count: t.usage_count + 1 } : t
        ),
        loading: false,
      }));
      return used.id;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateTemplateRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = assertApiData(await api.templates.update(id, data), '更新模板失败');
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updated : t)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      assertApiOk(await api.templates.delete(id), '删除失败');
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
