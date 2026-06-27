import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodoStore } from './todoStore';
import { useItemStore } from './itemStore';
import { socketService } from '../lib/socket';
import { showWebNotification } from '../lib/notifications';

const READ_IDS_KEY = 'notification_read_ids';
const PUSH_NOTIFICATIONS_KEY = 'push_notifications';

export interface Notification {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
  link?: string; // 深度链接路径（v1.1.0）
  conversation_id?: string; // 关联的对话 ID（v1.1.0）
}

interface NotificationState {
  notifications: Notification[];
  readIds: string[];
  loaded: boolean;
  /** 推送通知触发计数器，用于通知首页铃铛抖动 */
  pushTrigger: number;
  /** 生成并缓存通知列表（推送通知不会被覆盖） */
  refreshNotifications: () => void;
  /** 获取未读通知数量 */
  getUnreadCount: () => number;
  /** 加载已读 ID（初始化时调用） */
  loadReadIds: () => Promise<void>;
  /** 标记单条为已读 */
  markAsRead: (id: string) => Promise<void>;
  /** 标记单条为未读 */
  markAsUnread: (id: string) => Promise<void>;
  /** 标记全部为已读 */
  markAllAsRead: () => Promise<void>;
  /** 判断是否已读 */
  isRead: (id: string) => boolean;
  /** 添加一条推送通知 */
  addPushNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  readIds: [],
  loaded: false,
  pushTrigger: 0,

  refreshNotifications: () => {
    const { todos } = useTodoStore.getState();
    const { items } = useItemStore.getState();
    const pendingTodos = todos.filter((t) => !t.completed);
    const notifications: Notification[] = [];

    pendingTodos.slice(0, 3).forEach((todo) => {
      notifications.push({
        id: `todo-${todo.id}`,
        icon: 'check-circle-outline',
        iconBg: '#F59E0B',
        title: '待办提醒',
        desc: todo.title,
        time: todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '未设置截止日期',
      });
    });

    if (items.length > 0) {
      notifications.push({
        id: 'item-stats',
        icon: 'package-variant',
        iconBg: '#FF6B35',
        title: '物品统计',
        desc: `您共有 ${items.length} 件物品`,
        time: '刚刚',
      });
    }

    notifications.push({
      id: 'system-welcome',
      icon: 'information-outline',
      iconBg: '#7C5CFC',
      title: '系统通知',
      desc: '欢迎使用 LifeTracker，开始记录你的生活',
      time: '今天',
    });

    // 保留推送通知，不被覆盖
    const existing = get().notifications;
    const pushNotifications = existing.filter((n) => n.id.startsWith('push-'));

    set({ notifications: [...notifications, ...pushNotifications] });
  },

  getUnreadCount: () => {
    const notifications = get().notifications;
    const readIds = get().readIds;
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  },

  loadReadIds: async () => {
    try {
      const raw = await AsyncStorage.getItem(READ_IDS_KEY);
      if (raw) {
        set({ readIds: JSON.parse(raw), loaded: true });
      } else {
        set({ loaded: true });
      }
      // 加载完成后刷新通知列表
      get().refreshNotifications();
    } catch {
      set({ loaded: true });
    }
  },

  markAsRead: async (id) => {
    const newReadIds = [...new Set([...get().readIds, id])];
    set({ readIds: newReadIds });
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(newReadIds));
  },

  markAsUnread: async (id) => {
    const newReadIds = get().readIds.filter((rid) => rid !== id);
    set({ readIds: newReadIds });
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(newReadIds));
  },

  markAllAsRead: async () => {
    const notifications = get().notifications;
    const allIds = notifications.map((n) => n.id);
    set({ readIds: allIds });
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(allIds));
  },

  isRead: (id) => {
    return get().readIds.includes(id);
  },

  addPushNotification: (notification) => {
    const existing = get().notifications;
    // 避免重复添加
    if (existing.some((n) => n.id === notification.id)) return;
    set({
      notifications: [notification, ...existing],
      pushTrigger: get().pushTrigger + 1,
    });
  },

  /** 处理通知点击，导航到深度链接 */
  handleNotificationTap: (notification: Notification) => {
    if (notification.link) {
      // 返回路由函数供外部调用
      return notification.link;
    }
    return null;
  },
}));

// 监听 todos 和 items 的变化，自动刷新通知列表
let prevPendingTodoIds = '';
let prevItemsLength = -1;
let todoStoreReady = false;
let itemStoreReady = false;

useTodoStore.subscribe((state) => {
  todoStoreReady = true;
  const pendingTodoIds = state.todos
    .filter((t) => !t.completed)
    .slice(0, 3)
    .map((t) => `${t.id}-${t.title}-${t.due_date}`)
    .join('|');
  if (pendingTodoIds !== prevPendingTodoIds) {
    prevPendingTodoIds = pendingTodoIds;
    if (itemStoreReady) {
      useNotificationStore.getState().refreshNotifications();
    }
  }
});

useItemStore.subscribe((state) => {
  itemStoreReady = true;
  if (state.items.length !== prevItemsLength) {
    prevItemsLength = state.items.length;
    if (todoStoreReady) {
      useNotificationStore.getState().refreshNotifications();
    }
  }
});

// 监听 socket 提醒事件，推送通知到达时添加到通知中心并触发铃铛抖动
socketService.onReminderFired((todo) => {
  const notification: Notification = {
    id: `push-${todo.id}-${Date.now()}`,
    icon: 'bell-ring',
    iconBg: '#FF6B35',
    title: '待办提醒',
    desc: todo.title,
    time: '刚刚',
  };
  useNotificationStore.getState().addPushNotification(notification);
  // Web 端显示浏览器通知
  showWebNotification('待办提醒', todo.title);
});

// 监听 socket 新消息事件，自动添加通知（v1.1.0）
socketService.onMessageCreated((message: any) => {
  const store = useNotificationStore.getState();
  const notification: Notification = {
    id: `msg-${message.id || Date.now()}`,
    icon: message.type === 'item' ? 'package-variant' : message.type === 'todo' ? 'check-circle' : 'message-text',
    iconBg: '#7C5CFC',
    title: '新消息',
    desc: message.content || (message.type === 'item' ? '分享了一件物品' : message.type === 'todo' ? '分享了一条待办' : '新消息'),
    time: '刚刚',
    // 深度链接：点击后跳转到对话页
    link: `/message/${message.conversation_id}`,
  };
  store.addPushNotification(notification);
});
