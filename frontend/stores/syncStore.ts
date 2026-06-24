import { create } from 'zustand';
import { useItemStore } from './itemStore';
import { useTodoStore } from './todoStore';
import { useCategoryStore } from './categoryStore';
import { useLocationStore } from './locationStore';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  error: string | null;
  syncAll: () => Promise<void>;
  setStatus: (status: SyncStatus) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  lastSyncTime: null,
  error: null,
  
  syncAll: async () => {
    if (get().status === 'syncing') return;
    
    set({ status: 'syncing', error: null });
    
    try {
      // 并行同步所有数据
      await Promise.all([
        useItemStore.getState().fetchItems(),
        useTodoStore.getState().fetchTodos(),
        useCategoryStore.getState().fetchCategories(undefined, true),
        useLocationStore.getState().fetchLocations(true),
      ]);
      
      set({ 
        status: 'success', 
        lastSyncTime: Date.now(),
        error: null 
      });
      
      // 2秒后重置为 idle
      setTimeout(() => {
        if (get().status === 'success') {
          set({ status: 'idle' });
        }
      }, 2000);
    } catch (error) {
      set({ 
        status: 'error', 
        error: (error as Error).message || '同步失败' 
      });
      
      // 3秒后重置为 idle
      setTimeout(() => {
        if (get().status === 'error') {
          set({ status: 'idle', error: null });
        }
      }, 3000);
    }
  },
  
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));
