import { create } from 'zustand';
import { api, assertApiOk, assertApiData } from '../lib/api';
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
      const list = assertApiData(await api.borrowings.list(), '获取借用记录失败');
      set({ borrowings: list, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchActiveBorrowings: async () => {
    set({ loading: true, error: null });
    try {
      const list = assertApiData(await api.borrowings.active(), '获取借用记录失败');
      set({ activeBorrowings: list, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchByItemId: async (itemId: string) => {
    set({ loading: true, error: null });
    try {
      const list = assertApiData(await api.borrowings.getByItem(itemId), '获取借用记录失败');
      set({ borrowings: list, loading: false });
      return list;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return [];
    }
  },

  createBorrowing: async (data: CreateBorrowingRequest) => {
    set({ loading: true, error: null });
    try {
      const created = assertApiData(await api.borrowings.create(data), '创建借用记录失败');
      set((state) => ({
        borrowings: [created, ...state.borrowings],
        activeBorrowings: [created, ...state.activeBorrowings],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateBorrowing: async (id: string, data: UpdateBorrowingRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = assertApiData(await api.borrowings.update(id, data), '更新借用记录失败');
      set((state) => ({
        borrowings: state.borrowings.map((b) => (b.id === id ? updated : b)),
        activeBorrowings: data.status === 'returned'
          ? state.activeBorrowings.filter((b) => b.id !== id)
          : state.activeBorrowings.map((b) => (b.id === id ? updated : b)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteBorrowing: async (id: string) => {
    set({ loading: true, error: null });
    try {
      assertApiOk(await api.borrowings.delete(id), '删除失败');
      set((state) => ({
        borrowings: state.borrowings.filter((b) => b.id !== id),
        activeBorrowings: state.activeBorrowings.filter((b) => b.id !== id),
        loading: false,
      }));
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
