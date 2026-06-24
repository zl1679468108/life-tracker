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
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
