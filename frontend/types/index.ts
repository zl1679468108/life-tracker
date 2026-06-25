import { 
  ApiResponse, 
  ItemListResponse, 
  ItemResponse, 
  CreateItemRequest, 
  UpdateItemRequest,
  TodoListResponse,
  TodoResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  ReorderTodosRequest,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  LocationListResponse,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdatePasswordRequest,
  ChangePasswordRequest,
  OAuthRequest,
  FeedbackResponse,
  CreateFeedbackRequest,
  UploadResponse,
  ReorderResponse,
  ErrorResponse
} from './api';

// 重新导出所有类型
export {
  // API 类型
  ApiResponse,
  ItemListResponse,
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
  TodoListResponse,
  TodoResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  ReorderTodosRequest,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  LocationListResponse,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdatePasswordRequest,
  ChangePasswordRequest,
  OAuthRequest,
  FeedbackResponse,
  CreateFeedbackRequest,
  UploadResponse,
  ReorderResponse,
  ErrorResponse
};

// 原有的核心类型定义
export interface LifeItem {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  category_id?: string;
  images?: string[];
  barcode?: string; // 条形码/二维码
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface LifeTodo {
  id: string;
  title: string;
  description?: string;
  priority: number;
  due_date?: string;
  reminder_date?: string;
  notification_id?: string;
  completed: boolean;
  category_id?: string;
  images?: string[];
  sort_order?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface LifeLocation {
  id: string;
  name: string;
  icon?: string;
  parent_id?: string;
  level: number;
  user_id?: string;
}

export interface LifeCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  type: 'item' | 'todo';
  user_id?: string;
}

export interface LifeProfile {
  id: string;
  email?: string | null;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// 工具类型
export type Maybe<T> = T | null | undefined;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 表单验证错误类型
export interface FormErrors {
  [key: string]: string;
}

// 加载状态类型
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// 网络状态类型
export interface NetworkState {
  online: boolean;
  connected: boolean;
}

// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system';

// 通知类型
export interface Notification {
  id: string;
  type: 'todo_reminder' | 'system' | 'item_update';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

// 统计数据类型
export interface StatsData {
  totalItems: number;
  totalTodos: number;
  completedTodos: number;
  overdueTodos: number;
  categories: {
    name: string;
    count: number;
    color: string;
  }[];
  locations: {
    name: string;
    count: number;
  }[];
  todoCompletion: {
    date: string;
    count: number;
  }[];
}
