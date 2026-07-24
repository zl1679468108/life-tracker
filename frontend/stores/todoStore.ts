import { create } from 'zustand';
import { api, assertApiOk } from '../lib/api';
import { scheduleTodoReminder, cancelReminder } from '../lib/notifications';
import { useAuthStore } from './authStore';
import { LifeTodo } from '../types';
import { cache } from '../lib/cache';
import { networkMonitor } from '../lib/network';
import { socketService } from '../lib/socket';

const TODOS_CACHE_KEY = 'todos';
// 请求竞态守卫：仅接受最后一次 fetch 的结果
let fetchTodosRequestId = 0;

interface TodoState {
  todos: LifeTodo[];
  loading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  addTodo: (todo: Omit<LifeTodo, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<LifeTodo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  clearError: () => void;
  toggleComplete: (id: string) => Promise<void>;
  reorderTodos: (todos: LifeTodo[]) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  fetchTodos: async () => {
    const requestId = ++fetchTodosRequestId;
    const currentTodos = useTodoStore.getState().todos;
    set({ loading: currentTodos.length === 0, error: null });

    // 离线模式：优先从缓存加载
    if (!networkMonitor.isOnline()) {
      const cached = await cache.get<LifeTodo[]>(TODOS_CACHE_KEY);
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchTodosRequestId) return;
      if (cached) {
        set({ todos: cached, loading: false });
        return;
      }
    }

    try {
      const response = await api.todos.list();
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchTodosRequestId) return;
      const todos = Array.isArray(response?.data) ? response.data : [];
      set({ todos, loading: false });

      // 缓存数据
      await cache.set(TODOS_CACHE_KEY, todos);
    } catch (error) {
      console.error('fetchTodos error:', error);
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchTodosRequestId) return;

      // 网络错误时尝试从缓存加载
      if (!networkMonitor.isOnline()) {
        const cached = await cache.get<LifeTodo[]>(TODOS_CACHE_KEY);
        if (requestId !== fetchTodosRequestId) return;
        if (cached) {
          set({ todos: cached, loading: false });
          return;
        }
      }

      set({ error: (error as Error).message, loading: false });
    }
  },
  addTodo: async (todo) => {
    set({ loading: true, error: null });
    try {
      const response = await api.todos.create(todo);
      if (!response?.data || response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '创建待办失败');
      }
      const data = response.data;
      
      // 如果设置了提醒时间，调度通知
      if (todo.reminder_date) {
        const notificationId = await scheduleTodoReminder(
          data.id,
          todo.title,
          new Date(todo.reminder_date)
        );
        
        // 更新 todo 添加 notification_id
        if (notificationId) {
          await api.todos.update(data.id, { notification_id: notificationId });
          data.notification_id = notificationId;
        }
      }
      
      set((state) => ({
        todos: state.todos.find((existing) => existing.id === data.id)
          ? state.todos.map((existing) => (existing.id === data.id ? data : existing))
          : [data, ...state.todos],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  updateTodo: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const todo = useTodoStore.getState().todos.find((t) => t.id === id);
      
      // 处理提醒更新
      if (updates.reminder_date !== undefined) {
        // 取消旧的提醒
        if (todo?.notification_id) {
          await cancelReminder(todo.notification_id);
        }
        
        // 设置新的提醒
        if (updates.reminder_date) {
          const notificationId = await scheduleTodoReminder(
            id,
            updates.title || todo?.title || '',
            new Date(updates.reminder_date)
          );
          updates.notification_id = notificationId || undefined;
        } else {
          updates.notification_id = undefined;
        }
      }
      
      const response = await api.todos.update(id, updates);
      if (!response?.data || response.code === 'NETWORK_ERROR' || (typeof response.code === 'number' && response.code >= 400)) {
        throw new Error(response?.message || '更新待办失败');
      }
      const data = response.data;
      set((state) => ({ todos: state.todos.map((t) => t.id === id ? { ...t, ...updates, ...data } : t), loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  deleteTodo: async (id) => {
    set({ loading: true, error: null });
    try {
      const todo = useTodoStore.getState().todos.find((t) => t.id === id);
      
      // 取消提醒
      if (todo?.notification_id) {
        await cancelReminder(todo.notification_id);
      }
      
      assertApiOk(await api.todos.delete(id), '删除待办失败');
      set((state) => ({ todos: state.todos.filter((t) => t.id !== id), loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  toggleComplete: async (id) => {
    const todo = useTodoStore.getState().todos.find((t) => t.id === id);
    if (!todo) return;
    
    // 乐观更新：先更新本地状态
    const previousCompleted = todo.completed;
    set((state) => ({
      todos: state.todos.map((t) => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
    
    try {
      // 调用 API
      const response = await api.todos.update(id, { completed: !previousCompleted });
      const data = response.data;
      set((state) => ({
        todos: state.todos.map((t) => t.id === id ? { ...t, ...data } : t),
      }));
    } catch (error) {
      // 失败时回滚
      set((state) => ({
        todos: state.todos.map((t) => 
          t.id === id ? { ...t, completed: previousCompleted } : t
        ),
      }));
      set({ error: (error as Error).message });
    }
  },
  reorderTodos: async (reorderedTodos: LifeTodo[]) => {
    set({ loading: true, error: null });
    try {
      // 更新本地状态
      set({ todos: reorderedTodos });
      
      // 批量更新排序顺序
      const reorderData = reorderedTodos.map((todo, index) => ({
        id: todo.id,
        sort_order: index,
      }));
      
      await api.todos.reorder(reorderData);
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      // 失败时重新获取数据
      await get().fetchTodos();
    }
  },
}));

// 监听 socket 事件
socketService.onTodoCreated((todo) => {
  const currentTodos = useTodoStore.getState().todos;
  const existing = currentTodos.find((t) => t.id === todo.id);
  useTodoStore.setState({
    todos: existing
      ? currentTodos.map((t) => (t.id === todo.id ? todo : t))
      : [todo, ...currentTodos],
  });
});

socketService.onTodoUpdated((todo) => {
  useTodoStore.setState((state) => ({
    todos: state.todos.map(t => t.id === todo.id ? todo : t),
  }));
});

socketService.onTodoDeleted(({ id }) => {
  useTodoStore.setState((state) => ({
    todos: state.todos.filter(t => t.id !== id),
  }));
});
