import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useLocationStore } from '../stores/locationStore';
import { useTemplateStore } from '../stores/templateStore';
import { useBorrowingStore } from '../stores/borrowingStore';
import { useAuthStore } from '../stores/authStore';
import { Platform } from 'react-native';
import type { BackupExportData, ImportResult } from '../types';

export type ExportFormat = 'json' | 'csv';

/**
 * 导出数据为 JSON 格式
 */
export const exportToJSON = async (): Promise<string> => {
  const items = useItemStore.getState().items;
  const todos = useTodoStore.getState().todos;
  const categories = useCategoryStore.getState().categories;
  const locations = useLocationStore.getState().locations;
  const templates = useTemplateStore.getState().templates;
  const borrowings = useBorrowingStore.getState().borrowings;

  const data: BackupExportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    categories,
    locations,
    items,
    todos,
    templates,
    borrowings,
  };

  return JSON.stringify(data, null, 2);
};

/**
 * 导出数据为 CSV 格式
 */
export const exportToCSV = async (): Promise<string> => {
  const items = useItemStore.getState().items;
  const todos = useTodoStore.getState().todos;
  const categories = useCategoryStore.getState().categories;
  const locations = useLocationStore.getState().locations;

  const csvParts: string[] = [];

  // 物品数据
  csvParts.push('=== 物品数据 ===');
  csvParts.push('ID,名称,描述,分类ID,位置ID,创建时间,更新时间');
  items.forEach(item => {
    const row = [
      item.id,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.category_id || '',
      item.location_id || '',
      item.created_at,
      item.updated_at,
    ].join(',');
    csvParts.push(row);
  });

  csvParts.push('\n=== 待办数据 ===');
  csvParts.push('ID,标题,描述,优先级,截止日期,是否完成,分类ID,创建时间,更新时间');
  todos.forEach(todo => {
    const row = [
      todo.id,
      `"${(todo.title || '').replace(/"/g, '""')}"`,
      `"${(todo.description || '').replace(/"/g, '""')}"`,
      todo.priority,
      todo.due_date || '',
      todo.completed ? '是' : '否',
      todo.category_id || '',
      todo.created_at,
      todo.updated_at,
    ].join(',');
    csvParts.push(row);
  });

  csvParts.push('\n=== 分类数据 ===');
  csvParts.push('ID,名称,图标,颜色,类型');
  categories.forEach(category => {
    const row = [
      category.id,
      `"${(category.name || '').replace(/"/g, '""')}"`,
      category.icon || '',
      category.color || '',
      category.type,
    ].join(',');
    csvParts.push(row);
  });

  csvParts.push('\n=== 位置数据 ===');
  csvParts.push('ID,名称,图标,父级ID,层级');
  locations.forEach(location => {
    const row = [
      location.id,
      `"${(location.name || '').replace(/"/g, '""')}"`,
      location.icon || '',
      location.parent_id || '',
      location.level,
    ].join(',');
    csvParts.push(row);
  });

  return csvParts.join('\n');
};

/**
 * 导出数据并分享
 */
export const exportData = async (format: ExportFormat): Promise<void> => {
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'json') {
    content = await exportToJSON();
    filename = `lifetracker-export-${Date.now()}.json`;
    mimeType = 'application/json';
  } else {
    content = await exportToCSV();
    filename = `lifetracker-export-${Date.now()}.csv`;
    mimeType = 'text/csv';
  }

  // Web 端：使用 Blob 下载
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * 解析导入的 JSON 数据
 */
export const parseImportData = (content: string): BackupExportData | null => {
  try {
    const data = JSON.parse(content);
    // 检查是否为有效的备份文件
    if (data.version && data.items && data.todos) {
      return data as BackupExportData;
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * 预览导入数据
 */
export const previewImportData = (content: string): {
  items_count: number;
  todos_count: number;
  categories_count: number;
  locations_count: number;
} | null => {
  const data = parseImportData(content);
  if (!data) return null;
  return {
    items_count: data.items?.length || 0,
    todos_count: data.todos?.length || 0,
    categories_count: data.categories?.length || 0,
    locations_count: data.locations?.length || 0,
  };
};

/**
 * 执行导入（前端方式）
 */
export const importFromJSON = async (
  content: string,
  onProgress?: (step: string) => void
): Promise<ImportResult> => {
  const data = parseImportData(content);
  const result: ImportResult = {
    imported_items: 0,
    imported_todos: 0,
    imported_categories: 0,
    imported_locations: 0,
    errors: [],
  };

  if (!data) {
    result.errors.push({ row: 0, message: '无效的备份文件格式' });
    return result;
  }

  try {
    // 导入分类
    if (data.categories?.length > 0) {
      onProgress?.('正在导入分类...');
      const categoryStore = useCategoryStore.getState();
      for (const cat of data.categories) {
        try {
          await categoryStore.addCategory({
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
            user_id: cat.user_id,
          });
          result.imported_categories++;
        } catch (e) {
          result.errors.push({ row: 0, message: `分类 ${cat.name} 导入失败` });
        }
      }
    }

    // 导入位置
    if (data.locations?.length > 0) {
      onProgress?.('正在导入位置...');
      const locationStore = useLocationStore.getState();
      for (const loc of data.locations) {
        try {
          await locationStore.addLocation({
            name: loc.name,
            icon: loc.icon,
            parent_id: loc.parent_id,
            level: loc.level || 1,
            user_id: loc.user_id,
          });
          result.imported_locations++;
        } catch (e) {
          result.errors.push({ row: 0, message: `位置 ${loc.name} 导入失败` });
        }
      }
    }

    // 导入物品
    if (data.items?.length > 0) {
      onProgress?.('正在导入物品...');
      const itemStore = useItemStore.getState();
      const { user } = useAuthStore.getState();
      for (const item of data.items) {
        try {
          await itemStore.addItem({
            name: item.name,
            description: item.description,
            category_id: item.category_id,
            location_id: item.location_id,
            images: item.images,
            barcode: item.barcode,
            user_id: user?.id || item.user_id || '',
          });
          result.imported_items++;
        } catch (e) {
          result.errors.push({ row: 0, message: `物品 ${item.name} 导入失败` });
        }
      }
    }

    // 导入待办
    if (data.todos?.length > 0) {
      onProgress?.('正在导入待办...');
      const todoStore = useTodoStore.getState();
      const { user } = useAuthStore.getState();
      for (const todo of data.todos) {
        try {
          await todoStore.addTodo({
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            due_date: todo.due_date,
            category_id: todo.category_id,
            user_id: user?.id || todo.user_id || '',
            completed: todo.completed || false,
          });
          result.imported_todos++;
        } catch (e) {
          result.errors.push({ row: 0, message: `待办 ${todo.title} 导入失败` });
        }
      }
    }
  } catch (e) {
    result.errors.push({ row: 0, message: `导入过程出错: ${(e as Error).message}` });
  }

  return result;
};
