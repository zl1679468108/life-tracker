import { getAuthToken } from './token';
import { authSession } from './authSession';
import type {
  ApiResponse,
  LifeItem,
  LifeTodo,
  LifeCategory,
  LifeLocation,
  LifeProfile,
  LifeBorrowing,
  LifeShare,
  AuthResponse,
  UploadData,
  CreateItemRequest,
  UpdateItemRequest,
  CreateTodoRequest,
  UpdateTodoRequest,
  ReorderTodosRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
  LoginRequest,
  RegisterRequest,
  UpdatePasswordRequest,
  ChangePasswordRequest,
  CreateFeedbackRequest,
  CreateBorrowingRequest,
  UpdateBorrowingRequest,
  CreateShareRequest,
  UpdateShareRequest,
  LifeTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ValueHistory,
  UpdateItemValueRequest,
  RecordValueHistoryRequest,
  TotalValueResponse,
  AIRecognitionResult,
  AdvancedStats,
  TrendData,
  HeatmapData,
  CalendarMonthData,
  WidgetTodoData,
  WidgetStatsData,
  Message,
  Conversation,
  CreateMessageRequest,
  CreateConversationRequest,
} from '../types';
import { withRetry } from './retry';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3020';
let authExpiredEmitted = false;

const normalizeAuthResponse = (response: ApiResponse<any>): AuthResponse => {
  const data = response.data || {};
  const token = data.token || data.session?.access_token || data.session?.accessToken || null;
  const user = data.user || data.session?.user || null;
  return {
    code: response.code,
    data: {
      token,
      user,
    },
    message: response.message,
  };
};

interface RequestOptions {
  method?: string;
  body?: any;
  skipAuth?: boolean;
  timeout?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, skipAuth, timeout = 30000 } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // FormData 不设置 Content-Type，让浏览器自动设置 multipart boundary
  if (body instanceof FormData) {
    delete headers['Content-Type'];
  }

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    return await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (!authExpiredEmitted) {
            authExpiredEmitted = true;
            authSession.emitExpired();
          }
        }
        
        // 服务器错误（>=500）抛异常触发重试
        if (response.status >= 500) {
          throw { code: response.status, message: payload?.message || response.statusText || '服务器错误' };
        }
        
        return {
          code: response.status,
          data: null as T,
          message: payload?.message || response.statusText || '请求失败',
        };
      }

      return {
        code: payload?.code ?? response.status,
        data: payload?.data ?? payload,
        message: payload?.message,
      };
    }, method);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as ApiResponse<T>;
    }
    return {
      code: 'NETWORK_ERROR',
      data: null as T,
      message: error instanceof Error ? error.message : '网络错误',
    };
  }
}

export const resetAuthExpiredState = () => {
  authExpiredEmitted = false;
};

export const api = {
  items: {
    list: async (): Promise<ApiResponse<LifeItem[]>> => {
      return request<LifeItem[]>('/api/items');
    },
    
    get: async (id: string): Promise<ApiResponse<LifeItem>> => {
      return request<LifeItem>(`/api/items/${id}`);
    },
    
    create: async (data: CreateItemRequest): Promise<ApiResponse<LifeItem>> => {
      return request<LifeItem>('/api/items', { 
        method: 'POST', 
        body: data 
      });
    },
    
    update: async (id: string, data: UpdateItemRequest): Promise<ApiResponse<LifeItem>> => {
      return request<LifeItem>(`/api/items/${id}`, { 
        method: 'PUT', 
        body: data 
      });
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/items/${id}`, { 
        method: 'DELETE' 
      });
    },

    getExpiring: async (days?: number): Promise<ApiResponse<LifeItem[]>> => {
      const query = days ? `?days=${days}` : '';
      return request<LifeItem[]>(`/api/items/expiring${query}`);
    },
  },
  
  todos: {
    list: async (): Promise<ApiResponse<LifeTodo[]>> => {
      return request<LifeTodo[]>('/api/todos');
    },
    
    get: async (id: string): Promise<ApiResponse<LifeTodo>> => {
      return request<LifeTodo>(`/api/todos/${id}`);
    },
    
    create: async (data: CreateTodoRequest): Promise<ApiResponse<LifeTodo>> => {
      return request<LifeTodo>('/api/todos', { 
        method: 'POST', 
        body: data 
      });
    },
    
    update: async (id: string, data: UpdateTodoRequest): Promise<ApiResponse<LifeTodo>> => {
      return request<LifeTodo>(`/api/todos/${id}`, { 
        method: 'PUT', 
        body: data 
      });
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/todos/${id}`, { 
        method: 'DELETE' 
      });
    },
    
    reorder: async (data: ReorderTodosRequest[]): Promise<ApiResponse<string[]>> => {
      return request<string[]>('/api/todos/reorder', { 
        method: 'POST', 
        body: data 
      });
    },
  },
  
  categories: {
    list: async (type?: 'item' | 'todo'): Promise<ApiResponse<LifeCategory[]>> => {
      const path = type ? `/api/categories?type=${type}` : '/api/categories';
      return request<LifeCategory[]>(path);
    },
    
    get: async (id: string): Promise<ApiResponse<LifeCategory>> => {
      return request<LifeCategory>(`/api/categories/${id}`);
    },
    
    create: async (data: CreateCategoryRequest): Promise<ApiResponse<LifeCategory>> => {
      return request<LifeCategory>('/api/categories', { 
        method: 'POST', 
        body: data 
      });
    },
    
    update: async (id: string, data: UpdateCategoryRequest): Promise<ApiResponse<LifeCategory>> => {
      return request<LifeCategory>(`/api/categories/${id}`, { 
        method: 'PUT', 
        body: data 
      });
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/categories/${id}`, { 
        method: 'DELETE' 
      });
    },
  },
  
  locations: {
    list: async (): Promise<ApiResponse<LifeLocation[]>> => {
      return request<LifeLocation[]>('/api/locations');
    },
    
    get: async (id: string): Promise<ApiResponse<LifeLocation>> => {
      return request<LifeLocation>(`/api/locations/${id}`);
    },
    
    create: async (data: CreateLocationRequest): Promise<ApiResponse<LifeLocation>> => {
      return request<LifeLocation>('/api/locations', { 
        method: 'POST', 
        body: data 
      });
    },
    
    update: async (id: string, data: UpdateLocationRequest): Promise<ApiResponse<LifeLocation>> => {
      return request<LifeLocation>(`/api/locations/${id}`, { 
        method: 'PUT', 
        body: data 
      });
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/locations/${id}`, { 
        method: 'DELETE' 
      });
    },
  },
  
  feedback: {
    create: async (data: CreateFeedbackRequest): Promise<ApiResponse<{ id: string }>> => {
      return request<{ id: string }>('/api/feedback', { 
        method: 'POST', 
        body: data 
      });
    },
  },
  
  auth: {
    signIn: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await request<any>('/api/auth/signin', { 
        method: 'POST', 
        body: { email, password }, 
        skipAuth: true 
      });
      return normalizeAuthResponse(response);
    },
    
    signUp: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await request<any>('/api/auth/signup', { 
        method: 'POST', 
        body: { email, password }, 
        skipAuth: true 
      });
      return normalizeAuthResponse(response);
    },
    
    verifyEmail: async (token: string): Promise<ApiResponse<{ success: boolean }>> => {
      return request<{ success: boolean }>('/api/auth/verify-email', { 
        method: 'POST', 
        body: { token }, 
        skipAuth: true 
      });
    },
    
    resetPassword: async (email: string): Promise<ApiResponse<{ success: boolean }>> => {
      return request<{ success: boolean }>('/api/auth/reset-password', { 
        method: 'POST', 
        body: { email }, 
        skipAuth: true 
      });
    },
    
    updatePassword: async (password: string, token: string): Promise<ApiResponse<{ success: boolean }>> => {
      return request<{ success: boolean }>('/api/auth/update-password', { 
        method: 'POST', 
        body: { password, token }, 
        skipAuth: true 
      });
    },
    
    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> => {
      return request<{ success: boolean }>('/api/auth/change-password', { 
        method: 'POST', 
        body: { currentPassword, newPassword } 
      });
    },
    
    getProfile: async (): Promise<ApiResponse<LifeProfile>> => {
      return request<LifeProfile>('/api/auth/profile');
    },
    
    updateProfile: async (data: Partial<LifeProfile>): Promise<ApiResponse<LifeProfile>> => {
      return request<LifeProfile>('/api/auth/profile', { 
        method: 'PUT', 
        body: data 
      });
    },
    
    signInWithOAuth: async (provider: string, redirectTo: string): Promise<ApiResponse<{ url: string }>> => {
      return request<{ url: string }>('/api/auth/oauth', { 
        method: 'POST', 
        body: { provider, redirectTo }, 
        skipAuth: true 
      });
    },
  },
  
  upload: {
    single: async (formData: FormData): Promise<ApiResponse<UploadData>> => {
      return request<UploadData>('/api/upload/single', { 
        method: 'POST', 
        body: formData 
      });
    },
    
    batch: async (formData: FormData): Promise<ApiResponse<UploadData>> => {
      return request<UploadData>('/api/upload/batch', { 
        method: 'POST', 
        body: formData 
      });
    },
  },

  borrowings: {
    list: async (): Promise<ApiResponse<LifeBorrowing[]>> => {
      return request<LifeBorrowing[]>('/api/borrowings');
    },

    active: async (): Promise<ApiResponse<LifeBorrowing[]>> => {
      return request<LifeBorrowing[]>('/api/borrowings/active');
    },

    get: async (id: string): Promise<ApiResponse<LifeBorrowing>> => {
      return request<LifeBorrowing>(`/api/borrowings/${id}`);
    },

    getByItem: async (itemId: string): Promise<ApiResponse<LifeBorrowing[]>> => {
      return request<LifeBorrowing[]>(`/api/items/${itemId}/borrowings`);
    },

    create: async (data: CreateBorrowingRequest): Promise<ApiResponse<LifeBorrowing>> => {
      return request<LifeBorrowing>('/api/borrowings', {
        method: 'POST',
        body: data,
      });
    },

    update: async (id: string, data: UpdateBorrowingRequest): Promise<ApiResponse<LifeBorrowing>> => {
      return request<LifeBorrowing>(`/api/borrowings/${id}`, {
        method: 'PUT',
        body: data,
      });
    },

    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/borrowings/${id}`, {
        method: 'DELETE',
      });
    },
  },

  shares: {
    outgoing: async (): Promise<ApiResponse<LifeShare[]>> => {
      return request<LifeShare[]>('/api/shares/outgoing');
    },

    incoming: async (): Promise<ApiResponse<LifeShare[]>> => {
      return request<LifeShare[]>('/api/shares/incoming');
    },

    byResource: async (type: 'item' | 'todo', id: string): Promise<ApiResponse<LifeShare[]>> => {
      return request<LifeShare[]>(`/api/shares/resource/${type}/${id}`);
    },

    create: async (data: CreateShareRequest): Promise<ApiResponse<LifeShare>> => {
      return request<LifeShare>('/api/shares', {
        method: 'POST',
        body: data,
      });
    },

    update: async (id: string, data: UpdateShareRequest): Promise<ApiResponse<LifeShare>> => {
      return request<LifeShare>(`/api/shares/${id}`, {
        method: 'PUT',
        body: data,
      });
    },

    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/shares/${id}`, {
        method: 'DELETE',
      });
    },
  },

  templates: {
    list: async (type?: 'item' | 'todo'): Promise<ApiResponse<LifeTemplate[]>> => {
      const query = type ? `?type=${type}` : '';
      return request<LifeTemplate[]>(`/api/templates${query}`);
    },

    get: async (id: string): Promise<ApiResponse<LifeTemplate>> => {
      return request<LifeTemplate>(`/api/templates/${id}`);
    },

    create: async (data: CreateTemplateRequest): Promise<ApiResponse<LifeTemplate>> => {
      return request<LifeTemplate>('/api/templates', {
        method: 'POST',
        body: data,
      });
    },

    update: async (id: string, data: UpdateTemplateRequest): Promise<ApiResponse<LifeTemplate>> => {
      return request<LifeTemplate>(`/api/templates/${id}`, {
        method: 'PUT',
        body: data,
      });
    },

    delete: async (id: string): Promise<ApiResponse<string>> => {
      return request<string>(`/api/templates/${id}`, {
        method: 'DELETE',
      });
    },

    use: async (id: string, overrides?: Record<string, any>): Promise<ApiResponse<any>> => {
      return request<any>(`/api/templates/${id}/use`, {
        method: 'POST',
        body: { overrides },
      });
    },
  },

  // T47: 价值追踪
  itemsValue: {
    update: async (id: string, data: UpdateItemValueRequest): Promise<ApiResponse<LifeItem>> => {
      return request<LifeItem>(`/api/items/${id}/value`, { method: 'PUT', body: data });
    },
    history: async (itemId: string): Promise<ApiResponse<ValueHistory[]>> => {
      return request<ValueHistory[]>(`/api/items/${itemId}/value-history`);
    },
    recordHistory: async (itemId: string, data: RecordValueHistoryRequest): Promise<ApiResponse<ValueHistory>> => {
      return request<ValueHistory>(`/api/items/${itemId}/value-history`, { method: 'POST', body: data });
    },
    total: async (): Promise<ApiResponse<TotalValueResponse>> => {
      return request<TotalValueResponse>('/api/items/total-value');
    },
  },

  // T48: AI 识别
  ai: {
    recognize: async (formData: FormData): Promise<ApiResponse<AIRecognitionResult>> => {
      return request<AIRecognitionResult>('/api/ai/recognize', { method: 'POST', body: formData });
    },
  },

  // T49: 数据看板
  stats: {
    advanced: async (period: string = 'month'): Promise<ApiResponse<AdvancedStats>> => {
      return request<AdvancedStats>(`/api/stats/advanced?period=${period}`);
    },
    trends: async (metric: string = 'items', period: string = 'month'): Promise<ApiResponse<TrendData>> => {
      return request<TrendData>(`/api/stats/trends?metric=${metric}&period=${period}`);
    },
    heatmap: async (year?: number): Promise<ApiResponse<HeatmapData>> => {
      const query = year ? `?year=${year}` : '';
      return request<HeatmapData>(`/api/stats/heatmap${query}`);
    },
  },

  // T50: 日历视图
  calendar: {
    getMonth: async (year: number, month: number): Promise<ApiResponse<CalendarMonthData>> => {
      return request<CalendarMonthData>(`/api/calendar?year=${year}&month=${month}`);
    },
  },

  // T53: 桌面小组件
  widgets: {
    todos: async (limit: number = 5): Promise<ApiResponse<{ todos: WidgetTodoData[] }>> => {
      return request<{ todos: WidgetTodoData[] }>(`/api/widgets/todos?limit=${limit}`);
    },
    stats: async (): Promise<ApiResponse<WidgetStatsData>> => {
      return request<WidgetStatsData>('/api/widgets/stats');
    },
  },

  // v1.1.0: 消息模块
  messages: {
    conversations: async (): Promise<ApiResponse<Conversation[]>> => {
      return request<Conversation[]>('/api/messages/conversations');
    },

    getMessages: async (conversationId: string, limit?: number, before?: string): Promise<ApiResponse<Message[]>> => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));
      if (before) params.set('before', before);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<Message[]>(`/api/messages/conversations/${conversationId}${query}`);
    },

    createConversation: async (data: CreateConversationRequest): Promise<ApiResponse<Conversation>> => {
      return request<Conversation>('/api/messages/conversations', {
        method: 'POST',
        body: data,
      });
    },

    createMessage: async (conversationId: string, data: CreateMessageRequest): Promise<ApiResponse<Message>> => {
      return request<Message>(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: data,
      });
    },

    markAsRead: async (conversationId: string): Promise<ApiResponse<{ success: boolean }>> => {
      return request<{ success: boolean }>(`/api/messages/conversations/${conversationId}/read`, {
        method: 'PATCH',
      });
    },

    // v1.2.0: 搜索用户
    searchUsers: async (q: string): Promise<ApiResponse<{ id: string; email: string; display_name: string; avatar_url: string | null }[]>> => {
      return request<{ id: string; email: string; display_name: string; avatar_url: string | null }[]>(`/api/messages/users/search?q=${encodeURIComponent(q)}`);
    },

    // v1.2.0: 手动创建对话
    createManualConversation: async (data: { participant_ids: string[]; initial_message?: { type: string; content?: string; card_data?: any } }): Promise<ApiResponse<{ conversation: Conversation; message: Message | null }>> => {
      return request<{ conversation: Conversation; message: Message | null }>('/api/messages/conversations/manual', {
        method: 'POST',
        body: data,
      });
    },
  },
};
