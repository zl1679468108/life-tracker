import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { useColors } from '../stores/themeStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useItemStore } from '../stores/itemStore';
import { useLocationStore } from '../stores/locationStore';
import { useTodoStore } from '../stores/todoStore';
import { SafeScreen } from './SafeScreen';
import type { LifeCategory, LifeItem, LifeLocation, LifeTodo } from '../types';

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

type SearchResult =
  | { type: 'item'; data: LifeItem }
  | { type: 'todo'; data: LifeTodo }
  | { type: 'category'; data: LifeCategory }
  | { type: 'location'; data: LifeLocation }
  | { type: 'feature'; data: { id: string; title: string; description: string; route: string; icon: keyof typeof MaterialCommunityIcons.glyphMap } };

type ResultGroup = {
  key: SearchResult['type'];
  title: string;
  results: SearchResult[];
};

const featureEntries: SearchResult[] = [
  { type: 'feature', data: { id: 'items', title: '物品', description: '列表 / 新增 / 编辑', route: '/item/list', icon: 'package-variant' } },
  { type: 'feature', data: { id: 'todos', title: '待办', description: '筛选 / 完成 / 编辑', route: '/todo/list', icon: 'check-circle-outline' } },
  { type: 'feature', data: { id: 'messages', title: '消息', description: '好友 / 系统通知 / 对话', route: '/messages', icon: 'message-text-outline' } },
  { type: 'feature', data: { id: 'categories', title: '分类管理', description: '系统分类、自定义分类、颜色图标', route: '/settings/category-manage', icon: 'tag-multiple-outline' } },
  { type: 'feature', data: { id: 'locations', title: '位置管理', description: '房间、层级、存放位置', route: '/settings/location-manage', icon: 'map-marker-outline' } },
  { type: 'feature', data: { id: 'templates', title: '模板管理', description: '常用物品和待办模板', route: '/settings/templates', icon: 'file-document-outline' } },
  { type: 'feature', data: { id: 'borrowings', title: '借用管理', description: '借出、归还、逾期记录', route: '/settings/borrowings', icon: 'account-arrow-right-outline' } },
  { type: 'feature', data: { id: 'calendar', title: '日历视图', description: '待办和提醒日历', route: '/settings/calendar', icon: 'calendar-month-outline' } },
  { type: 'feature', data: { id: 'stats', title: '数据统计', description: '图表概览和趋势', route: '/settings/stats', icon: 'chart-bar' } },
  { type: 'feature', data: { id: 'notifications', title: '通知中心', description: '全部、未读、已读通知', route: '/settings/notifications', icon: 'bell-outline' } },
  { type: 'feature', data: { id: 'data', title: '数据管理', description: '备份、恢复、导入、导出', route: '/settings/data', icon: 'database-outline' } },
  { type: 'feature', data: { id: 'assets', title: '资产总览', description: '资产总值和分类分布', route: '/settings/assets', icon: 'wallet-outline' } },
  { type: 'feature', data: { id: 'widgets', title: '桌面快捷入口', description: 'PWA 安装和摘要预览', route: '/settings/widgets', icon: 'cellphone-link' } },
];

export function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { items } = useItemStore();
  const { todos } = useTodoStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { locations, fetchLocations } = useLocationStore();
  const [searchText, setSearchText] = useState('');
  const [groups, setGroups] = useState<ResultGroup[]>([]);

  useEffect(() => {
    if (visible) {
      void fetchCategories(undefined, true);
      void fetchLocations(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!searchText.trim()) {
      setGroups([]);
      return;
    }

    const query = searchText.toLowerCase();
    const matchedItems = items
      .filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(item => ({ type: 'item' as const, data: item }));

    const matchedTodos = todos
      .filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(todo => ({ type: 'todo' as const, data: todo }));

    const matchedCategories = categories
      .filter((category) =>
        category.name.toLowerCase().includes(query) ||
        category.type.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map((category) => ({ type: 'category' as const, data: category }));

    const matchedLocations = locations
      .filter((location) => location.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map((location) => ({ type: 'location' as const, data: location }));

    const matchedFeatures = featureEntries.filter((entry) => {
      if (entry.type !== 'feature') return false;
      return entry.data.title.toLowerCase().includes(query) || entry.data.description.toLowerCase().includes(query);
    }).slice(0, 8);

    const nextGroups: ResultGroup[] = [
      { key: 'feature', title: '功能入口', results: matchedFeatures },
      { key: 'item', title: '物品', results: matchedItems },
      { key: 'todo', title: '待办', results: matchedTodos },
      { key: 'category', title: '分类', results: matchedCategories },
      { key: 'location', title: '位置', results: matchedLocations },
    ];
    setGroups(nextGroups.filter((group) => group.results.length > 0));
  }, [searchText, items, todos, categories, locations]);

  const handleResultPress = (result: SearchResult) => {
    onClose();
    setSearchText('');
    if (result.type === 'item') {
      router.push(`/item/${result.data.id}`);
    } else if (result.type === 'todo') {
      router.push(`/todo/${result.data.id}`);
    } else if (result.type === 'category') {
      router.push('/settings/category-manage');
    } else if (result.type === 'location') {
      router.push('/settings/location-manage');
    } else {
      router.push(result.data.route as never);
    }
  };

  const handleClose = () => {
    setSearchText('');
    setGroups([]);
    onClose();
  };

  const totalResults = groups.reduce((sum, group) => sum + group.results.length, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <SafeScreen backgroundColor={palette.bg}>
        <View style={[styles.screen, { backgroundColor: palette.bg }]}>
          <View style={styles.header}>
            <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={palette.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: palette.text }]}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="搜索物品、待办、分类、位置..."
                placeholderTextColor={palette.textMuted}
                autoFocus
                returnKeyType="search"
              />
              {searchText.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={palette.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.75}>
              <Text style={[styles.cancelText, { color: palette.textSecondary }]}>取消</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsList} contentContainerStyle={styles.resultsContent} keyboardShouldPersistTaps="handled">
            {!searchText.trim() ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="text-search" size={46} color={palette.textDisabled} />
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>搜索物品、待办、分类、位置或工作台功能</Text>
              </View>
            ) : totalResults === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="text-search" size={46} color={palette.textDisabled} />
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>未找到相关结果</Text>
              </View>
            ) : (
              groups.map((group) => (
                <View key={group.key} style={styles.resultGroup}>
                  <View style={styles.groupHeader}>
                    <Text style={[styles.groupTitle, { color: palette.textSecondary }]}>{group.title}</Text>
                    <Text style={[styles.groupCount, { color: palette.textMuted }]}>{group.results.length}</Text>
                  </View>
                  {group.results.map((result, index) => (
                    <SearchResultRow
                      key={`${result.type}-${result.data.id}-${index}`}
                      result={result}
                      palette={palette}
                      onPress={() => handleResultPress(result)}
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </SafeScreen>
    </Modal>
  );
}

function getResultVisual(result: SearchResult, palette: typeof appDesign.dark) {
  if (result.type === 'item') return { icon: 'package-variant' as const, color: palette.orange, label: '物品' };
  if (result.type === 'todo') return { icon: 'check-circle-outline' as const, color: palette.success, label: '待办' };
  if (result.type === 'category') return { icon: (result.data.icon || 'tag-outline') as keyof typeof MaterialCommunityIcons.glyphMap, color: result.data.color || palette.violet, label: result.data.type === 'item' ? '物品分类' : '待办分类' };
  if (result.type === 'location') return { icon: (result.data.icon || 'map-marker-outline') as keyof typeof MaterialCommunityIcons.glyphMap, color: palette.warning, label: '位置' };
  return { icon: result.data.icon, color: palette.violet, label: '功能' };
}

function getResultTitle(result: SearchResult) {
  if (result.type === 'item') return result.data.name;
  if (result.type === 'todo') return result.data.title;
  if (result.type === 'category' || result.type === 'location') return result.data.name;
  return result.data.title;
}

function getResultDescription(result: SearchResult) {
  if (result.type === 'item') {
    const parts = [result.data.description, result.data.expiry_date ? '有到期日期' : undefined].filter(Boolean);
    return parts.join(' · ') || '打开物品编辑';
  }
  if (result.type === 'todo') {
    const parts = [result.data.description, result.data.due_date ? '有截止日期' : undefined, result.data.completed ? '已完成' : '待完成'].filter(Boolean);
    return parts.join(' · ');
  }
  if (result.type === 'category') return result.data.user_id ? '自定义分类' : '系统预设分类';
  if (result.type === 'location') return result.data.level > 0 ? `层级 ${result.data.level}` : '顶级位置';
  return result.data.description;
}

function SearchResultRow({
  result,
  palette,
  onPress,
}: {
  result: SearchResult;
  palette: typeof appDesign.dark;
  onPress: () => void;
}) {
  const visual = getResultVisual(result, palette);
  return (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[styles.resultIcon, { backgroundColor: `${visual.color}18` }]}>
        <MaterialCommunityIcons name={visual.icon} size={20} color={visual.color} />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: palette.text }]} numberOfLines={1}>
          {getResultTitle(result)}
        </Text>
        <Text style={[styles.resultDesc, { color: palette.textMuted }]} numberOfLines={1}>
          {getResultDescription(result)}
        </Text>
      </View>
      <View style={[styles.resultBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
        <Text style={[styles.resultBadgeText, { color: visual.color }]}>
          {visual.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 112,
    gap: spacing.sm,
  },
  resultGroup: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  groupTitle: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
  groupCount: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.base,
    marginTop: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },
  resultTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  resultDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  resultBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
