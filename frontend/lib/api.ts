import { getAuthToken } from './token';
import { authSession } from './authSession';
import type { 
  ApiResponse, 
  LifeItem, 
  LifeTodo, 
  LifeCategory, 
  LifeLocation, 
  LifeProfile,
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
  UploadResponse,
  ReorderResponse
} from '../types';

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
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        code: 'TIMEOUT',
        data: null as T,
        message: '请求超时',
      };
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

// 创建标准化的错误处理函数
function handleApiError(response: ApiResponse<any>): never {
  if (response.code !== 200 && response.code !== 201) {
    throw new Error(response.message || '请求失败');
  }
}

export const api = {
  items: {
    list: async (): Promise<ItemListResponse> => {
      const response = await request<LifeItem[]>('/api/items');
      return response as ItemListResponse;
    },
    
    get: async (id: string): Promise<ItemResponse> => {
      const response = await request<LifeItem>(`/api/items/${id}`);
      return response as ItemResponse;
    },
    
    create: async (data: CreateItemRequest): Promise<ItemResponse> => {
      const response = await request<LifeItem>('/api/items', { 
        method: 'POST', 
        body: data 
      });
      return response as ItemResponse;
    },
    
    update: async (id: string, data: UpdateItemRequest): Promise<ItemResponse> => {
      const response = await request<LifeItem>(`/api/items/${id}`, { 
        method: 'PUT', 
        body: data 
      });
      return response as ItemResponse;
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      const response = await request<string>(`/api/items/${id}`, { 
        method: 'DELETE' 
      });
      return response;
    },
  },
  
  todos: {
    list: async (): Promise<TodoListResponse> => {
      const response = await request<LifeTodo[]>('/api/todos');
      return response as TodoListResponse;
    },
    
    get: async (id: string): Promise<TodoResponse> => {
      const response = await request<LifeTodo>(`/api/todos/${id}`);
      return response as TodoResponse;
    },
    
    create: async (data: CreateTodoRequest): Promise<TodoResponse> => {
      const response = await request<LifeTodo>('/api/todos', { 
        method: 'POST', 
        body: data 
      });
      return response as TodoResponse;
    },
    
    update: async (id: string, data: UpdateTodoRequest): Promise<TodoResponse> => {
      const response = await request<LifeTodo>(`/api/todos/${id}`, { 
        method: 'PUT', 
        body: data 
      });
      return response as TodoResponse;
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      const response = await request<string>(`/api/todos/${id}`, { 
        method: 'DELETE' 
      });
      return response;
    },
    
    reorder: async (data: ReorderTodosRequest[]): Promise<ReorderResponse> => {
      const response = await request<string[]>('/api/todos/reorder', { 
        method: 'POST', 
        body: data 
      });
      return response as ReorderResponse;
    },
  },
  
  categories: {
    list: async (type?: string): Promise<CategoryListResponse> => {
      const path = type ? `/api/categories?type=${type}` : '/api/categories';
      const response = await request<LifeCategory[]>(path);
      return response as CategoryListResponse;
    },
    
    create: async (data: CreateCategoryRequest): Promise<CategoryResponse> => {
      const response = await request<LifeCategory>('/api/categories', { 
        method: 'POST', 
        body: data 
      });
      return response as CategoryResponse;
    },
    
    update: async (id: string, data: UpdateCategoryRequest): Promise<CategoryResponse> => {
      const response = await request<LifeCategory>(`/api/categories/${id}`, { 
        method: 'PUT', 
        body: data 
      });
      return response as CategoryResponse;
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      const response = await request<string>(`/api/categories/${id}`, { 
        method: 'DELETE' 
      });
      return response;
    },
  },
  
  locations: {
    list: async (): Promise<LocationListResponse> => {
      const response = await request<LifeLocation[]>('/api/locations');
      return response as LocationListResponse;
    },
    
    create: async (data: CreateLocationRequest): Promise<LocationResponse> => {
      const response = await request<LifeLocation>('/api/locations', { 
        method: 'POST', 
        body: data 
      });
      return response as LocationResponse;
    },
    
    update: async (id: string, data: UpdateLocationRequest): Promise<LocationResponse> => {
      const response = await request<LifeLocation>(`/api/locations/${id}`, { 
        method: 'PUT', 
        body: data 
      });
      return response as LocationResponse;
    },
    
    delete: async (id: string): Promise<ApiResponse<string>> => {
      const response = await request<string>(`/api/locations/${id}`, { 
        method: 'DELETE' 
      });
      return response;
    },
  },
  
  feedback: {
    create: async (data: CreateFeedbackRequest): Promise<ApiResponse<{ id: string }>> => {
      const response = await request<{ id: string }>('/api/feedback', { 
        method: 'POST', 
        body: data 
      });
      return response;
    },
  },
  
  auth: {
    signIn: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await request<AuthResponse>('/api/auth/signin', { 
        method: 'POST', 
        body: { email, password }, 
        skipAuth: true 
      });
      return normalizeAuthResponse(response);
    },
    
    signUp: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await request<AuthResponse>('/api/auth/signup', { 
        method: 'POST', 
        body: { email, password }, 
        skipAuth: true 
      });
      return normalizeAuthResponse(response);
    },
    
    verifyEmail: async (token: string): Promise<ApiResponse<{ success: boolean }>> => {
      const response = await request<{ success: boolean }>('/api/auth/verify-email', { 
        method: 'POST', 
        body: { token }, 
        skipAuth: true 
      });
      return response;
    },
    
    resetPassword: async (email: string): Promise<ApiResponse<{ success: boolean }>> => {
      const response = await request<{ success: boolean }>('/api/auth/reset-password', { 
        method: 'POST', 
        body: { email }, 
        skipAuth: true 
      });
      return response;
    },
    
    updatePassword: async (password: string, token: string): Promise<ApiResponse<{ success: boolean }>> => {
      const response = await request<{ success: boolean }>('/api/auth/update-password', { 
        method: 'POST', 
        body: { password, token }, 
        skipAuth: true 
      });
      return response;
    },
    
    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> => {
      const response = await request<{ success: boolean }>('/api/auth/change-password', { 
        method: 'POST', 
        body: { currentPassword, newPassword } 
      });
      return response;
    },
    
    getProfile: async (): Promise<ApiResponse<LifeProfile>> => {
      const response = await request<LifeProfile>('/api/auth/profile');
      return response;
    },
    
    updateProfile: async (data: Partial<LifeProfile>): Promise<ApiResponse<LifeProfile>> => {
      const response = await request<LifeProfile>('/api/auth/profile', { 
        method: 'PUT', 
        body: data 
      });
      return response;
    },
    
    signInWithOAuth: async (provider: string, redirectTo: string): Promise<ApiResponse<{ url: string }>> => {
      const response = await request<{ url: string }>('/api/auth/oauth', { 
        method: 'POST', 
        body: { provider, redirectTo }, 
        skipAuth: true 
      });
      return response;
    },
  },
  
  upload: {
    single: async (formData: FormData): Promise<UploadResponse> => {
      const response = await request<UploadResponse>('/api/upload/single', { 
        method: 'POST', 
        body: formData 
      });
      return response;
    },
    
    batch: async (formData: FormData): Promise<UploadResponse> => {
      const response = await request<UploadResponse>('/api/upload/batch', { 
        method: 'POST', 
        body: formData 
      });
      return response;
    },
  },
};

// 导出错误处理工具函数
export { handleApiError };
