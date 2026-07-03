import { create } from 'zustand';
import { api } from '../lib/api';
import { LifeTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '../types';

interface TemplateState {
  templates: LifeTemplate[];
  loading: boolean;
  error: string | null;
  fetchTemplates: (type?: 'item' | 'todo') => Promise<void>;
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

  fetchTemplates: async (type?: 'item' | 'todo') => {
    set({ loading: true, error: null });
    try {
      const res = await api.templates.list(type);
      if (res.data) {
        set({ templates: res.data, loading: false });
      } else {
        set({ error: res.message || '获取模板列表失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createTemplate: async (data: CreateTemplateRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await api.templates.create(data);
      if (res.data) {
        set((state) => ({
          templates: [res.data!, ...state.templates],
          loading: false,
        }));
      } else {
        const message = res.message || '创建模板失败';
        set({ error: message, loading: false });
        throw new Error(message);
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  useTemplate: async (id: string, overrides?: Record<string, any>) => {
    set({ loading: true, error: null });
    try {
      const res = await api.templates.use(id, overrides);
      if (res.data) {
        // 更新使用次数
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, usage_count: t.usage_count + 1 } : t
          ),
          loading: false,
        }));
        return res.data.id;
      } else {
        set({ error: res.message || '使用模板失败', loading: false });
        throw new Error(res.message || '使用模板失败');
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateTemplateRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await api.templates.update(id, data);
      if (res.data) {
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? res.data! : t)),
          loading: false,
        }));
      } else {
        set({ error: res.message || '更新模板失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.templates.delete(id);
      if (res.code === 200 || res.code === '200') {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          loading: false,
        }));
      } else {
        set({ error: res.message || '删除模板失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
