import { create } from 'zustand';
import { api } from '../lib/api';
import { cache } from '../lib/cache';
import { useItemStore } from './itemStore';
import { useTodoStore } from './todoStore';
import { useCategoryStore } from './categoryStore';
import { useLocationStore } from './locationStore';
import type { LifeItem, LifeTodo } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  error: string | null;
  syncAll: () => Promise<void>;
  setStatus: (status: SyncStatus) => void;
  setError: (error: string | null) => void;
}

// 比较时间戳：判断服务端数据是否比本地更新
function isServerNewer(
  serverUpdatedAt: string | undefined,
  localUpdatedAt: string | undefined
): boolean {
  // 本地无时间戳：服务端数据较新，覆盖
  if (!localUpdatedAt) return true;
  // 服务端无时间戳：不覆盖
  if (!serverUpdatedAt) return false;
  const serverTime = new Date(serverUpdatedAt).getTime();
  const localTime = new Date(localUpdatedAt).getTime();
  // 服务端时间戳更大时覆盖
  return serverTime > localTime;
}

// 基于 updated_at 合并数据：仅服务端较新时覆盖，保留本地离线创建的数据
function mergeByUpdatedAt<T extends { id: string; updated_at?: string }>(
  localList: T[],
  serverList: T[]
): T[] {
  const localMap = new Map(localList.map((item) => [item.id, item]));
  const seenIds = new Set<string>();
  const result: T[] = [];

  // 遍历服务端数据，仅服务端较新时覆盖
  for (const serverItem of serverList) {
    seenIds.add(serverItem.id);
    const localItem = localMap.get(serverItem.id);
    if (!localItem || isServerNewer(serverItem.updated_at, localItem.updated_at)) {
      result.push(serverItem);
    } else {
      // 本地较新或相等：保留本地数据
      result.push(localItem);
    }
  }

  // 保留本地存在但服务端不存在的数据（离线创建尚未同步）
  for (const localItem of localList) {
    if (!seenIds.has(localItem.id)) {
      result.push(localItem);
    }
  }

  return result;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  lastSyncTime: null,
  error: null,

  syncAll: async () => {
    if (get().status === 'syncing') return;

    set({ status: 'syncing', error: null });

    try {
      // 并行获取所有数据
      // 物品和待办：直接调用 API 以便基于 updated_at 合并，避免全量覆盖离线修改
      // 分类和位置：无 updated_at 字段，保持原有全量同步
      const [itemResult, todoResult] = await Promise.all([
        api.items.list(),
        api.todos.list(),
        useCategoryStore.getState().fetchCategories(undefined, true),
        useLocationStore.getState().fetchLocations(true),
      ]);

      // 合并物品数据：仅服务端较新时覆盖，保留本地离线修改
      if (Array.isArray(itemResult?.data)) {
        const localItems = useItemStore.getState().items;
        const mergedItems = mergeByUpdatedAt<LifeItem>(localItems, itemResult.data);
        useItemStore.setState({ items: mergedItems, loading: false, error: null });
        await cache.set('items', mergedItems);
      }

      // 合并待办数据：仅服务端较新时覆盖，保留本地离线修改
      if (Array.isArray(todoResult?.data)) {
        const localTodos = useTodoStore.getState().todos;
        const mergedTodos = mergeByUpdatedAt<LifeTodo>(localTodos, todoResult.data);
        useTodoStore.setState({ todos: mergedTodos, loading: false, error: null });
        await cache.set('todos', mergedTodos);
      }

      set({
        status: 'success',
        lastSyncTime: Date.now(),
        error: null,
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
        error: (error as Error).message || '同步失败',
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
