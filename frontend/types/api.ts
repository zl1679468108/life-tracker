import type { LifeProfile } from "./index";
export interface ApiResponse<T> {
  code: number | string;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// -- Request types --

export interface CreateItemRequest {
  name: string;
  description?: string;
  location_id?: string;
  category_id?: string;
  images?: string[];
  barcode?: string;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  location_id?: string;
  category_id?: string;
  images?: string[];
  barcode?: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: number;
  due_date?: string;
  reminder_date?: string;
  category_id?: string;
  images?: string[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: number;
  due_date?: string;
  reminder_date?: string;
  category_id?: string;
  images?: string[];
  completed?: boolean;
  notification_id?: string;
}

export interface ReorderTodosRequest {
  id: string;
  sort_order: number;
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  type: 'item' | 'todo';
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
}

export interface CreateLocationRequest {
  name: string;
  icon?: string;
  parent_id?: string;
}

export interface UpdateLocationRequest {
  name?: string;
  icon?: string;
  parent_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface OAuthRequest {
  provider: string;
  redirectTo: string;
}

export interface CreateFeedbackRequest {
  content: string;
  contact_info?: string;
}

// -- Response types --

// Auth returns nested token+user
export interface AuthResponse {
  code: number | string;
  data: {
    token: string;
    user: LifeProfile;
  };
  message?: string;
}

// Upload returns parsed server response
export interface UploadData {
  url: string;
  path: string;
  size: number;
}

export interface FeedbackData {
  id: string;
  content: string;
  contact_info?: string;
  created_at: string;
}

// -- Socket event types --

export interface SocketItemCreated {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  category_id?: string;
  images?: string[];
  barcode?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SocketItemUpdated {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  category_id?: string;
  images?: string[];
  barcode?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SocketItemDeleted {
  id: string;
}
