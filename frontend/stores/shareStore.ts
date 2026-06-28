import { create } from 'zustand';
import { api } from '../lib/api';
import { LifeShare, CreateShareRequest, UpdateShareRequest } from '../types';

interface ShareState {
  outgoingShares: LifeShare[];
  incomingShares: LifeShare[];
  resourceShares: LifeShare[];
  loading: boolean;
  error: string | null;
  fetchOutgoingShares: () => Promise<void>;
  fetchIncomingShares: () => Promise<void>;
  fetchResourceShares: (type: 'item' | 'todo', id: string) => Promise<void>;
  createShare: (data: CreateShareRequest) => Promise<LifeShare | undefined>;
  updateShare: (id: string, data: UpdateShareRequest) => Promise<void>;
  deleteShare: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useShareStore = create<ShareState>((set) => ({
  outgoingShares: [],
  incomingShares: [],
  resourceShares: [],
  loading: false,
  error: null,

  fetchOutgoingShares: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.shares.outgoing();
      if (res.data) {
        set({ outgoingShares: res.data, loading: false });
      } else {
        set({ error: res.message || '获取共享列表失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchIncomingShares: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.shares.incoming();
      if (res.data) {
        set({ incomingShares: res.data, loading: false });
      } else {
        set({ error: res.message || '获取共享列表失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchResourceShares: async (type: 'item' | 'todo', id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.shares.byResource(type, id);
      if (res.data) {
        set({ resourceShares: res.data, loading: false });
      } else {
        set({ error: res.message || '获取共享列表失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createShare: async (data: CreateShareRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await api.shares.create(data);
      if (res.data) {
        set((state) => ({
          outgoingShares: [res.data!, ...state.outgoingShares],
          resourceShares: [res.data!, ...state.resourceShares],
          loading: false,
        }));
        return res.data;
      } else {
        set({ error: res.message || '创建共享失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateShare: async (id: string, data: UpdateShareRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await api.shares.update(id, data);
      if (res.data) {
        set((state) => ({
          outgoingShares: state.outgoingShares.map((s) => (s.id === id ? res.data! : s)),
          incomingShares: state.incomingShares.map((s) => (s.id === id ? res.data! : s)),
          resourceShares: state.resourceShares.map((s) => (s.id === id ? res.data! : s)),
          loading: false,
        }));
      } else {
        set({ error: res.message || '更新失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteShare: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.shares.delete(id);
      if (res.code === 200 || res.code === '200') {
        set((state) => ({
          outgoingShares: state.outgoingShares.filter((s) => s.id !== id),
          incomingShares: state.incomingShares.filter((s) => s.id !== id),
          resourceShares: state.resourceShares.filter((s) => s.id !== id),
          loading: false,
        }));
      } else {
        set({ error: res.message || '删除失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
