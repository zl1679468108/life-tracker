import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTodoStore } from '../../stores/todoStore';
import { LifeTodo } from '../../types';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';
import { formatDateZh } from '../../lib/format';
import { FAB, Checkbox, Badge, PageLoadable, EmptyState, SegmentedTabs, SortPickerModal, ListSkeleton } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';

type FilterType = 'all' | 'pending' | 'completed';
type FocusFilterType = 'all' | 'today' | 'overdue' | 'reminder';
type SortType = 'time' | 'priority' | 'title';

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
const getDayDiff = (dateValue?: string) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((startOfDay(date) - startOfDay(new Date())) / DAY_MS);
};

const formatDueLabel = (dateValue?: string) => {
  const diff = getDayDiff(dateValue);
  if (diff === null) return '';
  if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
  if (diff === 0) return '今天截止';
  if (diff === 1) return '明天截止';
  return `${formatDateZh(dateValue!)} 截止`;
};

export default function TodoListScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = usePalette();
  const { todos, loading, error: todosError, fetchTodos, toggleComplete, deleteTodo, reorderTodos } = useTodoStore();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<FilterType>(
    params.filter === 'pending' || params.filter === 'completed' ? params.filter : 'all',
  );
  const [focusFilter, setFocusFilter] = useState<FocusFilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('time');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTodos();
    setRefreshing(false);
  }, [fetchTodos]);

  // 列表筛选结果 memo 化，避免每次渲染都重新计算
  const filtered = useMemo(() => todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  }).filter((t) => {
    if (focusFilter === 'today') return getDayDiff(t.due_date) === 0;
    if (focusFilter === 'overdue') {
      const diff = getDayDiff(t.due_date);
      return !t.completed && diff !== null && diff < 0;
    }
    if (focusFilter === 'reminder') return Boolean(t.reminder_date);
    return true;
  }).filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === 'priority') return b.priority - a.priority;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [todos, filter, focusFilter, searchQuery, sortBy]);

  const getPriorityLabel = (p: number) => {
    if (p === 3) return '紧急';
    if (p === 2) return '普通';
    return '低';
  };

  const getPriorityVariant = (p: number): 'high' | 'medium' | 'low' => {
    if (p === 3) return 'high';
    if (p === 2) return 'medium';
    return 'low';
  };

  // 焦点筛选计数 memo 化，避免每次渲染都重新计算
  const focusFilters: { key: FocusFilterType; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: '全部范围', count: todos.length },
    { key: 'today', label: '今日', count: todos.filter((todo) => getDayDiff(todo.due_date) === 0).length },
    { key: 'overdue', label: '逾期', count: todos.filter((todo) => !todo.completed && (getDayDiff(todo.due_date) ?? 0) < 0 && getDayDiff(todo.due_date) !== null).length },
    { key: 'reminder', label: '有提醒', count: todos.filter((todo) => Boolean(todo.reminder_date)).length },
  ], [todos]);

  const activeFilterCount = [
    filter !== 'all',
    focusFilter !== 'all',
    searchQuery.trim(),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilter('all');
    setFocusFilter('all');
    setSearchQuery('');
  };

  const handleDeleteTodo = (todo: LifeTodo) => {
    showAlert('确认删除', `删除待办"${todo.title}"？此操作不可撤销`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteTodo(todo.id) },
    ]);
  };

  // 拖拽渲染函数 useCallback 化，避免每次渲染都重新创建
  const renderDragItem = useCallback(({ item, drag, isActive }: { item: LifeTodo; drag: () => void; isActive: boolean }) => (
    <ScaleDecorator activeScale={1.05}>
      <TouchableOpacity
        style={[
          styles.todoCard,
          { backgroundColor: palette.surface },
          isActive && { opacity: 0.95, ...shadows.md },
        ]}
        onLongPress={drag}
        onPress={() => router.push(`/todo/${item.id}`)}
        activeOpacity={0.98}
        disabled={isActive}
      >
        <View style={styles.todoHeader}>
          <MaterialCommunityIcons name="drag" size={20} color={palette.textMuted} />
          <Checkbox checked={item.completed} onPress={() => toggleComplete(item.id)} />
          <View style={styles.todoContent}>
            <View style={styles.todoTitleRow}>
              <Text style={[styles.todoTitle, { color: palette.text }, item.completed && { textDecorationLine: 'line-through', color: palette.textDisabled }]}>
                {item.title}
              </Text>
            </View>
            {item.description && (
              <Text style={[styles.todoDesc, { color: palette.textMuted }]} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Badge label={getPriorityLabel(item.priority)} variant={getPriorityVariant(item.priority)} />
        </View>
        {(item.due_date || item.reminder_date || item.completed) && (
          <View style={styles.todoFooter}>
            {item.due_date && (
              <View style={[styles.metaPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={(getDayDiff(item.due_date) ?? 1) < 0 ? palette.danger : palette.textMuted} />
                <Text style={[styles.todoDate, { color: (getDayDiff(item.due_date) ?? 1) < 0 ? palette.danger : palette.textMuted }]}>
                  {formatDueLabel(item.due_date)}
                </Text>
              </View>
            )}
            {item.reminder_date && (
              <View style={[styles.metaPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="bell-outline" size={14} color={palette.warning} />
                <Text style={[styles.todoDate, { color: palette.warning }]}>有提醒</Text>
              </View>
            )}
            {item.completed && (
              <View style={[styles.metaPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={14} color={palette.success} />
                <Text style={[styles.todoDate, { color: palette.success }]}>已完成</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </ScaleDecorator>
  ), [palette, router, toggleComplete]);

  const renderItem = useCallback(({ item }: { item: LifeTodo }) => (
    <SwipeableRow onDelete={() => handleDeleteTodo(item)}>
      <TouchableOpacity
        style={[styles.todoCard, { backgroundColor: palette.surface }]}
        onPress={() => router.push(`/todo/${item.id}`)}
        activeOpacity={0.98}
      >
        <View style={styles.todoHeader}>
          <Checkbox checked={item.completed} onPress={() => toggleComplete(item.id)} />
          <View style={styles.todoContent}>
            <View style={styles.todoTitleRow}>
              <Text style={[styles.todoTitle, { color: palette.text }, item.completed && { textDecorationLine: 'line-through', color: palette.textDisabled }]}>
                {item.title}
              </Text>
            </View>
            {item.description && (
              <Text style={[styles.todoDesc, { color: palette.textMuted }]} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Badge label={getPriorityLabel(item.priority)} variant={getPriorityVariant(item.priority)} />
        </View>
        {(item.due_date || item.reminder_date || item.completed) && (
          <View style={styles.todoFooter}>
            {item.due_date && (
              <View style={[styles.metaPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={(getDayDiff(item.due_date) ?? 1) < 0 ? palette.danger : palette.textMuted} />
                <Text style={[styles.todoDate, { color: (getDayDiff(item.due_date) ?? 1) < 0 ? palette.danger : palette.textMuted }]}>
                  {formatDueLabel(item.due_date)}
                </Text>
              </View>
            )}
            {item.reminder_date && (
              <View style={[styles.metaPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="bell-outline" size={14} color={palette.warning} />
                <Text style={[styles.todoDate, { color: palette.warning }]}>有提醒</Text>
              </View>
            )}
            {item.completed && (
              <View style={[styles.metaPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={14} color={palette.success} />
                <Text style={[styles.todoDate, { color: palette.success }]}>已完成</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  ), [palette, router, toggleComplete]);

  const renderEmpty = () => (
    <EmptyState
      variant="todos"
      title={activeFilterCount === 0 ? '暂无待办事项' : '没有匹配的待办'}
      description={activeFilterCount === 0 ? '点击下方按钮添加第一个待办' : '调整筛选条件或清空搜索后再看看'}
      actionLabel="添加待办"
      onAction={() => router.push('/todo/create')}
      style={styles.inlineEmpty}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.bg }]}>
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={[styles.header, { backgroundColor: palette.bg }]}>
          <View style={styles.headerTop}>
            <SegmentedTabs
              tabs={[
                { key: 'all' as const, label: '全部' },
                { key: 'pending' as const, label: '待完成' },
                { key: 'completed' as const, label: '已完成' },
              ]}
              value={filter}
              onChange={setFilter}
              showCount={false}
            />
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, dragEnabled && { borderColor: palette.orange }]}
                onPress={() => setDragEnabled(!dragEnabled)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={dragEnabled ? 'check' : 'drag-variant'}
                  size={18}
                  color={dragEnabled ? palette.orange : palette.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, searchActive && { borderColor: palette.orange }]}
                onPress={() => {
                  setSearchActive((active) => {
                    const next = !active;
                    if (!next) setSearchQuery('');
                    setTimeout(() => {
                      if (next) searchInputRef.current?.focus();
                    }, 0);
                    return next;
                  });
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="搜索待办"
              >
                <MaterialCommunityIcons name={searchActive ? 'close' : 'magnify'} size={18} color={searchActive ? palette.orange : palette.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]} onPress={() => setShowSortModal(true)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="sort" size={18} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {searchActive && (
            <View style={[styles.searchBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, isSearchFocused && { borderColor: palette.orange }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={isSearchFocused ? palette.orange : palette.textMuted} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: palette.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="搜索待办标题..."
                placeholderTextColor={palette.textMuted}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}>
                  <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.focusFilters}>
            {focusFilters.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.focusFilterChip,
                  { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
                  focusFilter === item.key && { backgroundColor: palette.surface, borderColor: palette.orange },
                ]}
                onPress={() => setFocusFilter(item.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.focusFilterText, { color: focusFilter === item.key ? palette.orange : palette.textMuted }]}>
                  {item.label}
                </Text>
                <Text style={[styles.focusFilterCount, { color: focusFilter === item.key ? palette.orange : palette.textDisabled }]}>
                  {item.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeFilterCount > 0 && (
            <View style={styles.filterSummary}>
              <Text style={[styles.filterSummaryText, { color: palette.textMuted }]}>已启用 {activeFilterCount} 个筛选</Text>
              <TouchableOpacity onPress={clearFilters} activeOpacity={0.75}>
                <Text style={[styles.clearFilterText, { color: palette.orange }]}>清除</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            <ListSkeleton count={3} avatarSize={22} trailing />
          </View>
        ) : (
          <PageLoadable
            loading={false}
            error={todosError}
            onRetry={fetchTodos}
          >
            {dragEnabled ? (
              <DraggableFlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderDragItem}
                onDragEnd={({ data }) => reorderTodos(data)}
                contentContainerStyle={styles.list}
                ListEmptyComponent={renderEmpty}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
              />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={renderEmpty}
                removeClippedSubviews
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                windowSize={5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
              />
            )}
          </PageLoadable>
        )}

        <FAB variant="secondary" onPress={() => router.push('/todo/create')} />

        {showSortModal && (
          <SortPickerModal
            visible
            value={sortBy}
            options={[
              { key: 'time', label: '添加时间', icon: 'clock-outline' },
              { key: 'priority', label: '优先级', icon: 'flag-outline' },
              { key: 'title', label: '名称', icon: 'sort-alphabetical-ascending' },
            ]}
            onChange={setSortBy}
            onClose={() => setShowSortModal(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    padding: 0,
  },
  focusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  focusFilterChip: {
    minHeight: 36,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  focusFilterText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
  focusFilterCount: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  filterSummaryText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
  },
  clearFilterText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.bold,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  inlineEmpty: {
    minHeight: 420,
  },
  todoCard: {
    minHeight: 78,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  todoContent: {
    flex: 1,
  },
  todoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  todoTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  todoDesc: {
    fontSize: fontSize.base,
  },
  todoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginLeft: 34,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  todoDate: {
    fontSize: fontSize.sm,
  },
  skeletonList: {
    padding: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
