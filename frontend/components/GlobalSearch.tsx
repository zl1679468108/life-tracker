import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { useColors } from '../stores/themeStore';
import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';
import { SafeScreen } from './SafeScreen';

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

type SearchResult =
  | { type: 'item' | 'todo'; data: any }
  | { type: 'feature'; data: { id: string; title: string; description: string; route: string; icon: keyof typeof MaterialCommunityIcons.glyphMap } };

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
  { type: 'feature', data: { id: 'widgets', title: '桌面小组件', description: 'PWA 小组件和快捷入口', route: '/settings/widgets', icon: 'widgets-outline' } },
];

export function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { items } = useItemStore();
  const { todos } = useTodoStore();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!searchText.trim()) {
      setResults([]);
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

    const matchedFeatures = featureEntries.filter((entry) => {
      if (entry.type !== 'feature') return false;
      return entry.data.title.toLowerCase().includes(query) || entry.data.description.toLowerCase().includes(query);
    }).slice(0, 8);

    setResults([...matchedFeatures, ...matchedItems, ...matchedTodos]);
  }, [searchText, items, todos]);

  const handleResultPress = (result: SearchResult) => {
    onClose();
    setSearchText('');
    if (result.type === 'item') {
      router.push(`/item/${result.data.id}`);
    } else if (result.type === 'todo') {
      router.push(`/todo/${result.data.id}`);
    } else {
      router.push(result.data.route as never);
    }
  };

  const handleClose = () => {
    setSearchText('');
    setResults([]);
    onClose();
  };

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
                placeholder="搜索物品、待办或功能..."
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
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>搜索物品、待办或工作台功能</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="text-search" size={46} color={palette.textDisabled} />
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>未找到相关结果</Text>
              </View>
            ) : (
              results.map((result, index) => (
                <TouchableOpacity
                  key={`${result.type}-${result.data.id}-${index}`}
                  style={[styles.resultItem, { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={() => handleResultPress(result)}
                  activeOpacity={0.78}
                >
                  <View
                    style={[
                      styles.resultIcon,
                      { backgroundColor: result.type === 'item' ? `${palette.orange}18` : result.type === 'todo' ? `${palette.success}18` : `${palette.violet}18` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={result.type === 'item' ? 'package-variant' : result.type === 'todo' ? 'check-circle-outline' : result.data.icon}
                      size={20}
                      color={result.type === 'item' ? palette.orange : result.type === 'todo' ? palette.success : palette.violet}
                    />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, { color: palette.text }]} numberOfLines={1}>
                      {result.type === 'item' ? result.data.name : result.data.title}
                    </Text>
                    <Text style={[styles.resultDesc, { color: palette.textMuted }]} numberOfLines={1}>
                      {result.data.description || (result.type === 'feature' ? result.data.description : '')}
                    </Text>
                  </View>
                  <View style={[styles.resultBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                    <Text style={[styles.resultBadgeText, { color: result.type === 'item' ? palette.orange : result.type === 'todo' ? palette.success : palette.violet }]}>
                      {result.type === 'item' ? '物品' : result.type === 'todo' ? '待办' : '功能'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </SafeScreen>
    </Modal>
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
