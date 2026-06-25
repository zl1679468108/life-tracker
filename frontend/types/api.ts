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

// Items API 类型
export interface ItemListResponse {
  code: number | string;
  data: LifeItem[];
  message?: string;
}

export interface ItemResponse {
  code: number | string;
  data: LifeItem;
  message?: string;
}

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

// Todos API 类型
export interface TodoListResponse {
  code: number | string;
  data: LifeTodo[];
  message?: string;
}

export interface TodoResponse {
  code: number | string;
  data: LifeTodo;
  message?: string;
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
}

export interface ReorderTodosRequest {
  id: string;
  sort_order: number;
}

// Categories API 类型
export interface CategoryListResponse {
  code: number | string;
  data: LifeCategory[];
  message?: string;
}

export interface CategoryResponse {
  code: number | string;
  data: LifeCategory;
  message?: string;
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

// Locations API 类型
export interface LocationListResponse {
  code: number | string;
  data: LifeLocation[];
  message?: string;
}

export interface LocationResponse {
  code: number | string;
  data: LifeLocation;
  message?: string;
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

// Auth API 类型
export interface AuthResponse {
  code: number | string;
  data: {
    token: string;
    user: LifeProfile;
  };
  message?: string;
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

// Feedback API 类型
export interface FeedbackResponse {
  code: number | string;
  data: {
    id: string;
    content: string;
    contact_info?: string;
    created_at: string;
  };
  message?: string;
}

export interface CreateFeedbackRequest {
  content: string;
  contact_info?: string;
}

// Upload API 类型
export interface UploadResponse {
  code: number | string;
  data: {
    url: string;
    path: string;
    size: number;
  };
  message?: string;
}

export interface ReorderResponse {
  code: number | string;
  data: string[];
  message?: string;
}

// Socket Events 类型
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

// 错误响应类型
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// 响应联合类型
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
