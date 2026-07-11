import { create } from 'zustand';
import { api } from '../lib/api';
import { LifeShare, CreateShareRequest, UpdateShareRequest } from '../types';

interface ShareState {
  outgoingShares: LifeShare[];
  incomingShares: LifeShare[];
  resourceShares: LifeShare[];
  // 列表查询的 loading，仅用于 fetch 类操作
  listLoading: boolean;
  // 增删改操作的 loading，仅用于 mutation 类操作
  mutationLoading: boolean;
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
  listLoading: false,
  mutationLoading: false,
  error: null,

  fetchOutgoingShares: async () => {
    set({ listLoading: true, error: null });
    try {
      const res = await api.shares.outgoing();
      if (res.data) {
        set({ outgoingShares: res.data, listLoading: false });
      } else {
        set({ error: res.message || '获取共享列表失败', listLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, listLoading: false });
    }
  },

  fetchIncomingShares: async () => {
    set({ listLoading: true, error: null });
    try {
      const res = await api.shares.incoming();
      if (res.data) {
        set({ incomingShares: res.data, listLoading: false });
      } else {
        set({ error: res.message || '获取共享列表失败', listLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, listLoading: false });
    }
  },

  fetchResourceShares: async (type: 'item' | 'todo', id: string) => {
    set({ listLoading: true, error: null });
    try {
      const res = await api.shares.byResource(type, id);
      if (res.data) {
        set({ resourceShares: res.data, listLoading: false });
      } else {
        set({ error: res.message || '获取共享列表失败', listLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, listLoading: false });
    }
  },

  createShare: async (data: CreateShareRequest) => {
    set({ mutationLoading: true, error: null });
    try {
      const res = await api.shares.create(data);
      if (res.data) {
        set((state) => ({
          outgoingShares: [res.data!, ...state.outgoingShares],
          resourceShares: [res.data!, ...state.resourceShares],
          mutationLoading: false,
        }));
        return res.data;
      } else {
        const message = res.message || '创建共享失败';
        set({ error: message, mutationLoading: false });
        throw new Error(message);
      }
    } catch (error) {
      set({ error: (error as Error).message, mutationLoading: false });
      throw error;
    }
  },

  updateShare: async (id: string, data: UpdateShareRequest) => {
    set({ mutationLoading: true, error: null });
    try {
      const res = await api.shares.update(id, data);
      if (res.data) {
        set((state) => ({
          outgoingShares: state.outgoingShares.map((s) => (s.id === id ? res.data! : s)),
          incomingShares: state.incomingShares.map((s) => (s.id === id ? res.data! : s)),
          resourceShares: state.resourceShares.map((s) => (s.id === id ? res.data! : s)),
          mutationLoading: false,
        }));
      } else {
        const message = res.message || '更新失败';
        set({ error: message, mutationLoading: false });
        throw new Error(message);
      }
    } catch (error) {
      set({ error: (error as Error).message, mutationLoading: false });
      throw error;
    }
  },

  deleteShare: async (id: string) => {
    set({ mutationLoading: true, error: null });
    try {
      const res = await api.shares.delete(id);
      if (res.code === 200 || res.code === '200') {
        set((state) => ({
          outgoingShares: state.outgoingShares.filter((s) => s.id !== id),
          incomingShares: state.incomingShares.filter((s) => s.id !== id),
          resourceShares: state.resourceShares.filter((s) => s.id !== id),
          mutationLoading: false,
        }));
      } else {
        const message = res.message || '删除失败';
        set({ error: message, mutationLoading: false });
        throw new Error(message);
      }
    } catch (error) {
      set({ error: (error as Error).message, mutationLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
