import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useLocationStore } from '../stores/locationStore';
import { Platform } from 'react-native';

export type ExportFormat = 'json' | 'csv';

interface ExportData {
  items: any[];
  todos: any[];
  categories: any[];
  locations: any[];
  exportTime: string;
}

/**
 * 导出数据为 JSON 格式
 */
export const exportToJSON = async (): Promise<string> => {
  const items = useItemStore.getState().items;
  const todos = useTodoStore.getState().todos;
  const categories = useCategoryStore.getState().categories;
  const locations = useLocationStore.getState().locations;

  const data: ExportData = {
    items,
    todos,
    categories,
    locations,
    exportTime: new Date().toISOString(),
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
