import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useLocationStore } from '../stores/locationStore';
import { useTemplateStore } from '../stores/templateStore';
import { useBorrowingStore } from '../stores/borrowingStore';
import { useAuthStore } from '../stores/authStore';
import { Platform } from 'react-native';
import type { BackupExportData, ImportPreview, ImportResult } from '../types';

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

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();
const categoryKey = (category: any) => `${category?.type || 'item'}:${normalizeText(category?.name)}`;
const locationKey = (location: any, parentId?: string) => `${parentId || 'root'}:${normalizeText(location?.name)}`;
const itemKey = (item: any, categoryId?: string, locationId?: string) =>
  `${normalizeText(item?.name)}:${categoryId || ''}:${locationId || ''}:${normalizeText(item?.barcode)}`;
const todoKey = (todo: any, categoryId?: string) =>
  `${normalizeText(todo?.title)}:${categoryId || ''}:${todo?.due_date || ''}`;

const getCurrentData = () => ({
  categories: useCategoryStore.getState().categories,
  locations: useLocationStore.getState().locations,
  items: useItemStore.getState().items,
  todos: useTodoStore.getState().todos,
});

type ImportPlan = {
  data: BackupExportData;
  preview: ImportPreview;
  categoryIdMap: Map<string, string>;
  locationIdMap: Map<string, string>;
  categoryActions: Array<{ source: any; action: 'skip' | 'create'; existingId?: string }>;
  locationActions: Array<{ source: any; action: 'skip' | 'create'; existingId?: string; parentId?: string }>;
};

const buildImportPlan = (data: BackupExportData): ImportPlan => {
  const current = getCurrentData();
  const categoryIdMap = new Map<string, string>();
  const locationIdMap = new Map<string, string>();
  const categoryByKey = new Map(current.categories.map((category: any) => [categoryKey(category), category.id]));
  const locationByKey = new Map(current.locations.map((location: any) => [locationKey(location, location.parent_id), location.id]));
  const categoryActions: ImportPlan['categoryActions'] = [];
  const locationActions: ImportPlan['locationActions'] = [];

  for (const category of data.categories || []) {
    const key = categoryKey(category);
    const existingId = categoryByKey.get(key);
    if (category.id && existingId) categoryIdMap.set(category.id, existingId);
    categoryActions.push({ source: category, action: existingId ? 'skip' : 'create', existingId });
  }

  const sortedLocations = [...(data.locations || [])].sort((a, b) => (a.level || 1) - (b.level || 1));
  for (const location of sortedLocations) {
    const mappedParentId = location.parent_id ? locationIdMap.get(location.parent_id) : undefined;
    const key = locationKey(location, mappedParentId);
    const existingId = locationByKey.get(key);
    if (location.id && existingId) locationIdMap.set(location.id, existingId);
    locationActions.push({ source: location, action: existingId ? 'skip' : 'create', existingId, parentId: mappedParentId });
  }

  const currentItemKeys = new Set(current.items.map((item: any) => itemKey(item, item.category_id, item.location_id)));
  const currentTodoKeys = new Set(current.todos.map((todo: any) => todoKey(todo, todo.category_id)));
  const importedItemKeys = new Set<string>();
  const importedTodoKeys = new Set<string>();
  const sourceCategoryIds = new Set((data.categories || []).map((category) => category.id).filter(Boolean));
  const sourceLocationIds = new Set((data.locations || []).map((location) => location.id).filter(Boolean));

  let duplicateItems = 0;
  let duplicateTodos = 0;
  let remappedItemCategories = 0;
  let remappedItemLocations = 0;
  let remappedTodoCategories = 0;

  for (const item of data.items || []) {
    const mappedCategoryId = item.category_id ? categoryIdMap.get(item.category_id) || item.category_id : undefined;
    const mappedLocationId = item.location_id ? locationIdMap.get(item.location_id) || item.location_id : undefined;
    if (item.category_id && sourceCategoryIds.has(item.category_id)) remappedItemCategories++;
    if (item.location_id && sourceLocationIds.has(item.location_id)) remappedItemLocations++;
    const key = itemKey(item, mappedCategoryId, mappedLocationId);
    if (currentItemKeys.has(key) || importedItemKeys.has(key)) duplicateItems++;
    importedItemKeys.add(key);
  }

  for (const todo of data.todos || []) {
    const mappedCategoryId = todo.category_id ? categoryIdMap.get(todo.category_id) || todo.category_id : undefined;
    if (todo.category_id && sourceCategoryIds.has(todo.category_id)) remappedTodoCategories++;
    const key = todoKey(todo, mappedCategoryId);
    if (currentTodoKeys.has(key) || importedTodoKeys.has(key)) duplicateTodos++;
    importedTodoKeys.add(key);
  }

  const duplicateCategories = categoryActions.filter((action) => action.action === 'skip').length;
  const duplicateLocations = locationActions.filter((action) => action.action === 'skip').length;

  return {
    data,
    preview: {
      items_count: data.items?.length || 0,
      todos_count: data.todos?.length || 0,
      categories_count: data.categories?.length || 0,
      locations_count: data.locations?.length || 0,
      duplicate_items: duplicateItems,
      duplicate_todos: duplicateTodos,
      duplicate_categories: duplicateCategories,
      duplicate_locations: duplicateLocations,
      new_items: (data.items?.length || 0) - duplicateItems,
      new_todos: (data.todos?.length || 0) - duplicateTodos,
      new_categories: categoryActions.length - duplicateCategories,
      new_locations: locationActions.length - duplicateLocations,
      remapped_item_categories: remappedItemCategories,
      remapped_item_locations: remappedItemLocations,
      remapped_todo_categories: remappedTodoCategories,
    },
    categoryIdMap,
    locationIdMap,
    categoryActions,
    locationActions,
  };
};

const refreshImportDependencies = async () => {
  await Promise.all([
    useCategoryStore.getState().fetchCategories(undefined, true),
    useLocationStore.getState().fetchLocations(true),
    useItemStore.getState().fetchItems(),
    useTodoStore.getState().fetchTodos(),
  ]);
};

/**
 * 预览导入数据
 */
export const previewImportData = async (content: string): Promise<ImportPreview | null> => {
  const data = parseImportData(content);
  if (!data) return null;
  await refreshImportDependencies();
  return buildImportPlan(data).preview;
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
    skipped_items: 0,
    skipped_todos: 0,
    skipped_categories: 0,
    skipped_locations: 0,
    errors: [],
  };

  if (!data) {
    result.errors.push({ row: 0, message: '无效的备份文件格式' });
    return result;
  }

  try {
    await refreshImportDependencies();
    const plan = buildImportPlan(data);

    // 导入分类
    if (plan.categoryActions.length > 0) {
      onProgress?.('正在导入分类...');
      const categoryStore = useCategoryStore.getState();
      for (const action of plan.categoryActions) {
        const cat = action.source;
        if (action.action === 'skip') {
          if (cat.id && action.existingId) plan.categoryIdMap.set(cat.id, action.existingId);
          result.skipped_categories = (result.skipped_categories || 0) + 1;
          continue;
        }
        try {
          await categoryStore.addCategory({
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
            user_id: cat.user_id,
          });
          const created = useCategoryStore.getState().categories.find((category: any) => categoryKey(category) === categoryKey(cat));
          if (cat.id && created?.id) plan.categoryIdMap.set(cat.id, created.id);
          result.imported_categories++;
        } catch (e) {
          result.errors.push({ row: 0, message: `分类 ${cat.name} 导入失败` });
        }
      }
    }

    // 导入位置
    if (plan.locationActions.length > 0) {
      onProgress?.('正在导入位置...');
      const locationStore = useLocationStore.getState();
      for (const action of plan.locationActions) {
        const loc = action.source;
        const parentId = loc.parent_id ? plan.locationIdMap.get(loc.parent_id) : undefined;
        if (action.action === 'skip') {
          if (loc.id && action.existingId) plan.locationIdMap.set(loc.id, action.existingId);
          result.skipped_locations = (result.skipped_locations || 0) + 1;
          continue;
        }
        try {
          await locationStore.addLocation({
            name: loc.name,
            icon: loc.icon,
            parent_id: parentId,
            level: loc.level || 1,
            user_id: loc.user_id,
          });
          const created = useLocationStore.getState().locations.find((location: any) => locationKey(location, location.parent_id) === locationKey(loc, parentId));
          if (loc.id && created?.id) plan.locationIdMap.set(loc.id, created.id);
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
      const existingKeys = new Set(useItemStore.getState().items.map((item: any) => itemKey(item, item.category_id, item.location_id)));
      for (const item of data.items) {
        const mappedCategoryId = item.category_id ? plan.categoryIdMap.get(item.category_id) || item.category_id : undefined;
        const mappedLocationId = item.location_id ? plan.locationIdMap.get(item.location_id) || item.location_id : undefined;
        const key = itemKey(item, mappedCategoryId, mappedLocationId);
        if (existingKeys.has(key)) {
          result.skipped_items = (result.skipped_items || 0) + 1;
          continue;
        }
        try {
          await itemStore.addItem({
            name: item.name,
            description: item.description,
            category_id: mappedCategoryId,
            location_id: mappedLocationId,
            images: item.images,
            barcode: item.barcode,
            expiry_date: item.expiry_date,
            reminder_enabled: item.reminder_enabled,
            reminder_days_before: item.reminder_days_before,
            purchase_price: item.purchase_price,
            purchase_date: item.purchase_date,
            current_value: item.current_value,
            currency: item.currency,
            depreciation_rate: item.depreciation_rate,
            user_id: user?.id || item.user_id || '',
          });
          existingKeys.add(key);
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
      const existingKeys = new Set(useTodoStore.getState().todos.map((todo: any) => todoKey(todo, todo.category_id)));
      for (const todo of data.todos) {
        const mappedCategoryId = todo.category_id ? plan.categoryIdMap.get(todo.category_id) || todo.category_id : undefined;
        const key = todoKey(todo, mappedCategoryId);
        if (existingKeys.has(key)) {
          result.skipped_todos = (result.skipped_todos || 0) + 1;
          continue;
        }
        try {
          await todoStore.addTodo({
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            due_date: todo.due_date,
            reminder_date: todo.reminder_date,
            images: todo.images,
            category_id: mappedCategoryId,
            user_id: user?.id || todo.user_id || '',
            completed: todo.completed || false,
          });
          existingKeys.add(key);
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
