import { 
  ApiResponse,
  PaginatedResponse,
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
  OAuthRequest,
  CreateFeedbackRequest,
  AuthResponse,
  UploadData,
  FeedbackData,
  SocketItemCreated,
  SocketItemUpdated,
  SocketItemDeleted,
} from './api';

// 重新导出所有类型
export {
  ApiResponse,
  PaginatedResponse,
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
  OAuthRequest,
  CreateFeedbackRequest,
  AuthResponse,
  UploadData,
  FeedbackData,
  SocketItemCreated,
  SocketItemUpdated,
  SocketItemDeleted,
};

// 原有的核心类型定义
export interface LifeItem {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  category_id?: string;
  images?: string[];
  barcode?: string;
  expiry_date?: string;
  reminder_enabled?: boolean;
  reminder_days_before?: number;
  is_borrowed?: boolean;
  borrowed_by?: string;
  // T47: 价值追踪
  purchase_price?: number;
  purchase_date?: string;
  current_value?: number;
  currency?: string;
  depreciation_rate?: number;
  // T48: AI 识别
  ai_suggestions?: Record<string, any>;
  ai_confidence?: number;
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
  type: 'todo_reminder' | 'system' | 'item_update' | 'expiry_reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

// 提醒日志类型
export interface ReminderLog {
  id: string;
  resource_type: 'item' | 'todo';
  resource_id: string;
  reminder_type: 'expiry' | 'due_date' | 'custom';
  sent_at: string;
  user_id: string;
}

// 借用记录类型
export interface LifeBorrowing {
  id: string;
  item_id: string;
  borrower_name: string;
  borrower_contact?: string;
  borrow_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  item_name?: string; // 物品名称（关联查询）
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

// 提醒更新请求
export interface UpdateItemReminderRequest {
  enabled: boolean;
  reminder_days_before?: number;
}

// 借用记录请求
export interface CreateBorrowingRequest {
  item_id: string;
  borrower_name: string;
  borrower_contact?: string;
  expected_return_date?: string;
  notes?: string;
}

export interface UpdateBorrowingRequest {
  actual_return_date?: string;
  status?: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
}

// 共享关系类型
export interface LifeShare {
  id: string;
  owner_id: string;
  shared_with_id: string;
  resource_type: 'item' | 'todo';
  resource_id: string;
  permission: 'view' | 'edit';
  created_at: string;
  owner_name?: string;
  shared_with_name?: string;
  resource_name?: string;
}

// 共享请求
export interface CreateShareRequest {
  shared_with_email: string;
  resource_type: 'item' | 'todo';
  resource_id: string;
  permission: 'view' | 'edit';
}

export interface UpdateShareRequest {
  permission: 'view' | 'edit';
}

// 模板类型
export interface LifeTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'item' | 'todo';
  data: Record<string, any>;
  icon?: string;
  color?: string;
  usage_count: number;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// 模板请求
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  template_type: 'item' | 'todo';
  data: Record<string, any>;
  icon?: string;
  color?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  icon?: string;
  color?: string;
}

// 备份导出数据类型
export interface BackupExportData {
  version: string;
  exported_at: string;
  categories: any[];
  locations: any[];
  items: any[];
  todos: any[];
  templates?: any[];
  borrowings?: any[];
}

// 导入结果
export interface ImportResult {
  imported_items: number;
  imported_todos: number;
  imported_categories: number;
  imported_locations: number;
  errors: Array<{ row: number; message: string }>;
}

// T47: 价值追踪类型
export interface ValueHistory {
  id: string;
  item_id: string;
  value: number;
  reason?: string;
  recorded_at: string;
  user_id: string;
  item_name?: string;
}

export interface UpdateItemValueRequest {
  current_value?: number;
  purchase_price?: number;
  purchase_date?: string;
  depreciation_rate?: number;
}

export interface RecordValueHistoryRequest {
  value: number;
  reason?: string;
}

export interface TotalValueResponse {
  total_purchase_price: number;
  total_current_value: number;
  total_depreciation: number;
  by_category: Array<{
    category_id: string;
    category_name: string;
    total_value: number;
  }>;
}

// T48: AI 识别类型
export interface AIRecognitionResult {
  category: string;
  brand?: string;
  model?: string;
  confidence: number;
  tags: string[];
}

// T49: 数据看板类型
export interface AdvancedStats {
  items: {
    added: number;
    by_category: Array<{ category_id: string; category_name: string; count: number }>;
    by_location: Array<{ location_id: string; location_name: string; count: number }>;
  };
  todos: {
    created: number;
    completed: number;
    completion_rate: number;
    by_priority: Array<{ priority: number; label: string; count: number }>;
    avg_completion_time_hours: number;
  };
  activity: {
    most_active_day: string;
    most_active_hour: number;
  };
}

export interface TrendData {
  labels: string[];
  data: number[];
}

export interface HeatmapData {
  dates: Array<{ date: string; count: number }>;
}

// T50: 日历视图类型
export interface CalendarDay {
  date: string;
  todos: Array<{
    id: string;
    title: string;
    priority: number;
    completed: boolean;
  }>;
  events: Array<{
    type: 'expiry' | 'borrow_return' | 'custom';
    item_id?: string;
    item_name?: string;
    description: string;
  }>;
}

export interface CalendarMonthData {
  days: CalendarDay[];
}

// T53: 桌面小组件类型
export interface WidgetTodoData {
  id: string;
  title: string;
  priority: number;
  due_date?: string;
  completed: boolean;
}

export interface WidgetStatsData {
  items_count: number;
  todos_pending: number;
  todos_completed: number;
}

// v1.1.0: 消息模块类型
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'item' | 'todo' | 'text' | 'system';
  resource_type?: 'item' | 'todo';
  resource_id?: string;
  content?: string;
  card_data?: Record<string, any>;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_type?: string;
  last_message_content?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
  };
  last_message?: {
    type: string;
    content?: string;
    card_data?: Record<string, any>;
    created_at: string;
  };
  unread_count?: number;
}

export interface CreateMessageRequest {
  type: string;
  resource_type?: string;
  resource_id?: string;
  content?: string;
  card_data?: Record<string, any>;
}

export interface CreateConversationRequest {
  participant_ids: string[];
  last_message_type?: string;
  last_message_content?: string;
  last_message_at?: string;
}
