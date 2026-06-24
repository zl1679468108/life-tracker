import { create } from 'zustand';
import { api } from '../lib/api';
import { LifeLocation } from '../types';
import { cache } from '../lib/cache';
import { networkMonitor } from '../lib/network';
import { socketService } from '../lib/socket';

const LOCATIONS_CACHE_KEY = 'locations';

interface LocationState {
  locations: LifeLocation[];
  loading: boolean;
  error: string | null;
  fetchLocations: (force?: boolean) => Promise<void>;
  addLocation: (location: Omit<LifeLocation, 'id'>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<LifeLocation>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [],
  loading: false,
  error: null,
  fetchLocations: async (force = false) => {
    // 防止重复请求：已有数据且非强制刷新时跳过
    if (!force && get().locations.length > 0 && !get().error) return;
    if (get().loading) return;
    set({ loading: true, error: null });
    
    // 离线模式：优先从缓存加载
    if (!networkMonitor.isOnline()) {
      const cached = await cache.get<LifeLocation[]>(LOCATIONS_CACHE_KEY);
      if (cached) {
        set({ locations: cached, loading: false });
        return;
      }
    }
    
    try {
      const data = await api.locations.list();
      const locations = data || [];
      set({ locations, loading: false });
      
      // 缓存数据
      await cache.set(LOCATIONS_CACHE_KEY, locations);
    } catch (error) {
      // 网络错误时尝试从缓存加载
      if (!networkMonitor.isOnline()) {
        const cached = await cache.get<LifeLocation[]>(LOCATIONS_CACHE_KEY);
        if (cached) {
          set({ locations: cached, loading: false });
          return;
        }
      }
      
      set({ error: (error as Error).message, loading: false });
    }
  },
  addLocation: async (location) => {
    set({ loading: true, error: null });
    try {
      const data = await api.locations.create(location);
      set((state) => ({ locations: [...state.locations, data], loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  updateLocation: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await api.locations.update(id, updates);
      set((state) => ({
        locations: state.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  deleteLocation: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.locations.delete(id);
      set((state) => ({
        locations: state.locations.filter((l) => l.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

// 监听 socket 事件
socketService.onLocationCreated((location) => {
  const currentLocations = useLocationStore.getState().locations;
  if (!currentLocations.find(l => l.id === location.id)) {
    useLocationStore.setState({ locations: [...currentLocations, location] });
  }
});

socketService.onLocationDeleted(({ id }) => {
  useLocationStore.setState((state) => ({
    locations: state.locations.filter(l => l.id !== id),
  }));
});
