import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './token';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3020';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  // 延迟注册的回调，socket 连接后自动绑定
  private pendingCallbacks: Array<{ event: string; callback: (...args: any[]) => void }> = [];

  async connect(userId: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.userId = userId;
    const socketUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3020';
    // 读取 token 用于后端鉴权（连接时校验，校验失败会被服务端断开）
    const token = await getAuthToken();
    this.socket = io(socketUrl, {
      // 允许 polling 回退，受限网络环境（如代理/防火墙拦截 ws）下可降级到轮询
      transports: ['polling', 'websocket'],
      autoConnect: true,
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      // 后端已在 handleConnection 中根据 token 自动 join 房间；
      // 这里保留显式 join 以兼容旧逻辑，但服务端会校验身份一致性。
      this.socket?.emit('join', userId);
      // 绑定之前注册的延迟回调
      for (const { event, callback } of this.pendingCallbacks) {
        this.socket?.on(event, callback);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('leave', this.userId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
    this.pendingCallbacks = [];
  }

  // 通用监听方法，支持 socket 未连接时延迟注册
  private on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      this.pendingCallbacks.push({ event, callback });
    }
  }

  // 通用取消监听
  private off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
    // 同时清理 pending 队列中的回调
    this.pendingCallbacks = this.pendingCallbacks.filter(
      (c) => !(c.event === event && c.callback === callback)
    );
  }

  // 监听/取消监听物品创建
  onItemCreated(callback: (item: any) => void) {
    this.on('items:created', callback);
  }
  offItemCreated(callback: (item: any) => void) {
    this.off('items:created', callback);
  }

  // 监听/取消监听物品更新
  onItemUpdated(callback: (item: any) => void) {
    this.on('items:updated', callback);
  }
  offItemUpdated(callback: (item: any) => void) {
    this.off('items:updated', callback);
  }

  // 监听/取消监听物品删除
  onItemDeleted(callback: (data: { id: string }) => void) {
    this.on('items:deleted', callback);
  }
  offItemDeleted(callback: (data: { id: string }) => void) {
    this.off('items:deleted', callback);
  }

  // 监听/取消监听待办创建
  onTodoCreated(callback: (todo: any) => void) {
    this.on('todos:created', callback);
  }
  offTodoCreated(callback: (todo: any) => void) {
    this.off('todos:created', callback);
  }

  // 监听/取消监听待办更新
  onTodoUpdated(callback: (todo: any) => void) {
    this.on('todos:updated', callback);
  }
  offTodoUpdated(callback: (todo: any) => void) {
    this.off('todos:updated', callback);
  }

  // 监听/取消监听待办删除
  onTodoDeleted(callback: (data: { id: string }) => void) {
    this.on('todos:deleted', callback);
  }
  offTodoDeleted(callback: (data: { id: string }) => void) {
    this.off('todos:deleted', callback);
  }

  // 监听/取消监听分类创建
  onCategoryCreated(callback: (category: any) => void) {
    this.on('categories:created', callback);
  }
  offCategoryCreated(callback: (category: any) => void) {
    this.off('categories:created', callback);
  }

  // 监听/取消监听分类删除
  onCategoryDeleted(callback: (data: { id: string }) => void) {
    this.on('categories:deleted', callback);
  }
  offCategoryDeleted(callback: (data: { id: string }) => void) {
    this.off('categories:deleted', callback);
  }

  // 监听/取消监听位置创建
  onLocationCreated(callback: (location: any) => void) {
    this.on('locations:created', callback);
  }
  offLocationCreated(callback: (location: any) => void) {
    this.off('locations:created', callback);
  }

  // 监听/取消监听位置删除
  onLocationDeleted(callback: (data: { id: string }) => void) {
    this.on('locations:deleted', callback);
  }
  offLocationDeleted(callback: (data: { id: string }) => void) {
    this.off('locations:deleted', callback);
  }

  // 监听/取消监听提醒触发
  onReminderFired(callback: (todo: any) => void) {
    this.on('reminders:fired', callback);
  }
  offReminderFired(callback: (todo: any) => void) {
    this.off('reminders:fired', callback);
  }

  // 监听/取消监听新消息（v1.1.0）
  onMessageCreated(callback: (message: any) => void) {
    this.on('messages:new', callback);
  }
  offMessageCreated(callback: (message: any) => void) {
    this.off('messages:new', callback);
  }

  // 监听/取消监听对话更新（v1.1.0）
  onConversationUpdated(callback: (conversation: any) => void) {
    this.on('conversations:updated', callback);
  }
  offConversationUpdated(callback: (conversation: any) => void) {
    this.off('conversations:updated', callback);
  }

  // 监听/取消监听好友请求更新
  onFriendRequestUpdated(callback: (payload: any) => void) {
    this.on('friends:request-updated', callback);
  }
  offFriendRequestUpdated(callback: (payload: any) => void) {
    this.off('friends:request-updated', callback);
  }

  /**
   * @deprecated 不要调用此方法，它会移除所有事件监听器（包括 store 级别的监听）。
   * 请改用对应的 off* 方法单独移除监听器。
   */
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
