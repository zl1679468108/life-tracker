import { create } from 'zustand';
import { api, assertApiData } from '../lib/api';
import type { Message, CreateMessageRequest } from '../types';

interface MessageState {
  currentConversationId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchMessages: (conversationId: string, limit?: number, before?: string) => Promise<void>;
  sendMessage: (conversationId: string, data: CreateMessageRequest) => Promise<Message | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  clearMessages: () => void;
  // Socket 回调：收到新消息时追加
  addRemoteMessage: (message: Message) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  currentConversationId: null,
  messages: [],
  loading: false,
  error: null,

  setCurrentConversation: (id: string | null) => {
    set({ currentConversationId: id, messages: [] });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  fetchMessages: async (conversationId: string, limit = 50, before?: string) => {
    set({ loading: true, error: null });
    try {
      const list = assertApiData(await api.messages.getMessages(conversationId, limit, before), '获取消息失败');
      set((state) => ({
        // before 游标分页：拉取的是更早的历史消息，需要前置拼接；
        // 首次加载（无 before）或切换会话时直接覆盖。
        messages: before && state.currentConversationId === conversationId
          ? [...list, ...state.messages]
          : list,
        loading: false,
        error: null,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  sendMessage: async (conversationId: string, data: CreateMessageRequest) => {
    try {
      const created = assertApiData(await api.messages.createMessage(conversationId, data), '发送失败');
      set((state) => ({
        messages: [...state.messages, created],
      }));
      return created;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      await api.messages.markAsRead(conversationId);
    } catch {
      // 已读标记失败不影响主流程
    }
  },

  // 收到远程新消息时追加到列表
  addRemoteMessage: (message: Message) => {
    const state = get();
    // 只追加属于当前对话的消息
    if (state.currentConversationId && message.conversation_id === state.currentConversationId) {
      // 防止重复：如果消息 ID 已存在，跳过
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return;
      set((state) => ({
        messages: [...state.messages, message],
      }));
    }
  },
}));
