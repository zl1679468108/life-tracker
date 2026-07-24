import { create } from 'zustand';
import { api, assertApiData } from '../lib/api';
import type { Conversation, CreateConversationRequest } from '../types';

interface ConversationState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  createConversation: (data: CreateConversationRequest) => Promise<Conversation | null>;
  // Socket 回调：对话更新时替换到列表头部
  updateRemoteConversation: (conversation: Conversation) => void;
}

// 请求竞态守卫：仅接受最后一次 fetch 的结果
let fetchConversationsRequestId = 0;

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  loading: false,
  error: null,

  fetchConversations: async () => {
    const requestId = ++fetchConversationsRequestId;
    set({ loading: true, error: null });
    try {
      const list = assertApiData(await api.messages.conversations(), '获取对话列表失败');
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchConversationsRequestId) return;
      set({ conversations: list, loading: false });
    } catch (error) {
      // 已有更新的请求发起，丢弃本次过期结果
      if (requestId !== fetchConversationsRequestId) return;
      set({ error: (error as Error).message, loading: false });
    }
  },

  createConversation: async (data: CreateConversationRequest) => {
    try {
      const created = assertApiData(await api.messages.createConversation(data), '创建对话失败');
      set((state) => ({
        conversations: [created, ...state.conversations],
      }));
      return created;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  // 收到远程对话更新时，将对话移到列表头部并更新最后消息
  updateRemoteConversation: (conversation: Conversation) => {
    set((state) => {
      const existing = state.conversations.findIndex((c) => c.id === conversation.id);
      if (existing === -1) {
        // 新对话，前置插入
        return { conversations: [conversation, ...state.conversations] };
      }
      // 更新现有对话
      const updated = [...state.conversations];
      updated[existing] = conversation;
      // 移到最前面
      const sorted = [conversation, ...updated.filter((_, i) => i !== existing)];
      return { conversations: sorted };
    });
  },
}));
