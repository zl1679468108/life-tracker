import { create } from 'zustand';
import { api } from '../lib/api';
import { LifeBorrowing, CreateBorrowingRequest, UpdateBorrowingRequest } from '../types';

interface BorrowingState {
  borrowings: LifeBorrowing[];
  activeBorrowings: LifeBorrowing[];
  loading: boolean;
  error: string | null;
  fetchBorrowings: () => Promise<void>;
  fetchActiveBorrowings: () => Promise<void>;
  fetchByItemId: (itemId: string) => Promise<LifeBorrowing[]>;
  createBorrowing: (data: CreateBorrowingRequest) => Promise<void>;
  updateBorrowing: (id: string, data: UpdateBorrowingRequest) => Promise<void>;
  deleteBorrowing: (id: string) => Promise<void>;
  returnBorrowing: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBorrowingStore = create<BorrowingState>((set, get) => ({
  borrowings: [],
  activeBorrowings: [],
  loading: false,
  error: null,

  fetchBorrowings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.borrowings.list();
      if (res.data) {
        set({ borrowings: res.data, loading: false });
      } else {
        set({ error: res.message || '获取借用记录失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchActiveBorrowings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.borrowings.active();
      if (res.data) {
        set({ activeBorrowings: res.data, loading: false });
      } else {
        set({ error: res.message || '获取借用记录失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchByItemId: async (itemId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.borrowings.getByItem(itemId);
      set({ loading: false });
      if (res.data) {
        set({ borrowings: res.data });
        return res.data;
      }
      set({ error: res.message || '获取借用记录失败' });
      return [];
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return [];
    }
  },

  createBorrowing: async (data: CreateBorrowingRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await api.borrowings.create(data);
      if (res.data) {
        set((state) => ({
          borrowings: [res.data!, ...state.borrowings],
          activeBorrowings: [res.data!, ...state.activeBorrowings],
          loading: false,
        }));
      } else {
        set({ error: res.message || '创建借用记录失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateBorrowing: async (id: string, data: UpdateBorrowingRequest) => {
    set({ loading: true, error: null });
    try {
      const res = await api.borrowings.update(id, data);
      if (res.data) {
        set((state) => ({
          borrowings: state.borrowings.map((b) => (b.id === id ? res.data! : b)),
          activeBorrowings: data.status === 'returned'
            ? state.activeBorrowings.filter((b) => b.id !== id)
            : state.activeBorrowings.map((b) => (b.id === id ? res.data! : b)),
          loading: false,
        }));
      } else {
        set({ error: res.message || '更新借用记录失败', loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteBorrowing: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.borrowings.delete(id);
      if (res.code === 200 || res.code === '200') {
        set((state) => ({
          borrowings: state.borrowings.filter((b) => b.id !== id),
          activeBorrowings: state.activeBorrowings.filter((b) => b.id !== id),
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

  returnBorrowing: async (id: string) => {
    await get().updateBorrowing(id, {
      status: 'returned',
      actual_return_date: new Date().toISOString(),
    });
  },

  clearError: () => set({ error: null }),
}));
