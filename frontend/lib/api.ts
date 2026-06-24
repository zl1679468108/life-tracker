import { getAuthToken } from './token';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3020';

interface RequestOptions {
  method?: string;
  body?: any;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {};

  // FormData 不设置 Content-Type，让浏览器自动设置 multipart boundary
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `请求失败: ${response.status}`);
  }

  return response.json();
}

export const api = {
  items: {
    list: () => request<any[]>('/api/items'),
    get: (id: string) => request<any>(`/api/items/${id}`),
    create: (data: any) => request<any>('/api/items', { method: 'POST', body: data }),
    update: (id: string, data: any) => request<any>(`/api/items/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<any>(`/api/items/${id}`, { method: 'DELETE' }),
  },
  todos: {
    list: () => request<any[]>('/api/todos'),
    get: (id: string) => request<any>(`/api/todos/${id}`),
    create: (data: any) => request<any>('/api/todos', { method: 'POST', body: data }),
    update: (id: string, data: any) => request<any>(`/api/todos/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<any>(`/api/todos/${id}`, { method: 'DELETE' }),
    reorder: (data: { id: string; sort_order: number }[]) => request<any>('/api/todos/reorder', { method: 'POST', body: data }),
  },
  categories: {
    list: (type?: string) => request<any[]>(`/api/categories${type ? `?type=${type}` : ''}`),
    create: (data: any) => request<any>('/api/categories', { method: 'POST', body: data }),
    update: (id: string, data: any) => request<any>(`/api/categories/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<any>(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  locations: {
    list: () => request<any[]>('/api/locations'),
    create: (data: any) => request<any>('/api/locations', { method: 'POST', body: data }),
    update: (id: string, data: any) => request<any>(`/api/locations/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<any>(`/api/locations/${id}`, { method: 'DELETE' }),
  },
  feedback: {
    create: (data: any) => request<any>('/api/feedback', { method: 'POST', body: data }),
  },
  auth: {
    signIn: (email: string, password: string) => request<any>('/api/auth/signin', { method: 'POST', body: { email, password }, skipAuth: true }),
    signUp: (email: string, password: string) => request<any>('/api/auth/signup', { method: 'POST', body: { email, password }, skipAuth: true }),
    verifyEmail: (token: string) => request<any>('/api/auth/verify-email', { method: 'POST', body: { token }, skipAuth: true }),
    resetPassword: (email: string) => request<any>('/api/auth/reset-password', { method: 'POST', body: { email }, skipAuth: true }),
    updatePassword: (password: string, token: string) => request<any>('/api/auth/update-password', { method: 'POST', body: { password, token }, skipAuth: true }),
    changePassword: (currentPassword: string, newPassword: string) => request<any>('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
    getProfile: () => request<any>('/api/auth/profile'),
    updateProfile: (data: any) => request<any>('/api/auth/profile', { method: 'PUT', body: data }),
    signInWithOAuth: (provider: string, redirectTo: string) => request<any>('/api/auth/oauth', { method: 'POST', body: { provider, redirectTo }, skipAuth: true }),
  },
  upload: {
    single: (formData: FormData) => request<any>('/api/upload/single', { method: 'POST', body: formData }),
    batch: (formData: FormData) => request<any>('/api/upload/batch', { method: 'POST', body: formData }),
  },
};
