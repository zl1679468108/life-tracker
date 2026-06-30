import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTodoStore } from '../../stores/todoStore';
import { LifeTodo } from '../../types';
import { appDesign, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FAB, Checkbox, Badge, PageLoadable, Skeleton } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';

type FilterType = 'all' | 'pending' | 'completed';
type SortType = 'time' | 'priority' | 'title';

export default function TodoListScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { todos, loading, error: todosError, fetchTodos, toggleComplete, deleteTodo, reorderTodos } = useTodoStore();
  const [filter, setFilter] = useState<FilterType>('all');
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

  const filtered = todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  }).filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === 'priority') return b.priority - a.priority;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

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

  const handleDeleteTodo = (todo: LifeTodo) => {
    showAlert('确认删除', `删除待办"${todo.title}"？此操作不可撤销`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteTodo(todo.id) },
    ]);
  };

  const renderDragItem = ({ item, drag, isActive }: { item: LifeTodo; drag: () => void; isActive: boolean }) => (
    <ScaleDecorator activeScale={1.05}>
      <TouchableOpacity
        style={[
          styles.todoCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
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
              {item.completed && <Text style={[styles.todoStatus, { color: palette.success }]}>已完成</Text>}
            </View>
            {item.description && (
              <Text style={[styles.todoDesc, { color: palette.textMuted }]} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Badge label={getPriorityLabel(item.priority)} variant={getPriorityVariant(item.priority)} />
        </View>
        {item.due_date && (
          <View style={styles.todoFooter}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={palette.textMuted} />
            <Text style={[styles.todoDate, { color: palette.textMuted }]}>
              截止: {new Date(item.due_date).toLocaleDateString('zh-CN')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScaleDecorator>
  );

  const renderItem = useCallback(({ item }: { item: LifeTodo }) => (
    <SwipeableRow onDelete={() => handleDeleteTodo(item)}>
      <TouchableOpacity
        style={[styles.todoCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
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
              {item.completed && <Text style={[styles.todoStatus, { color: palette.success }]}>已完成</Text>}
            </View>
            {item.description && (
              <Text style={[styles.todoDesc, { color: palette.textMuted }]} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Badge label={getPriorityLabel(item.priority)} variant={getPriorityVariant(item.priority)} />
        </View>
        {item.due_date && (
          <View style={styles.todoFooter}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={palette.textMuted} />
            <Text style={[styles.todoDate, { color: palette.textMuted }]}>
              截止: {new Date(item.due_date).toLocaleDateString('zh-CN')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  ), [palette, router, toggleComplete]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.bg }]}>
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <View style={[styles.header, { backgroundColor: palette.bg }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>通用列表布局</Text>
              <Text style={[styles.title, { color: palette.text }]}>待办</Text>
            </View>
            <View style={styles.headerActions}>
              <Text style={[styles.count, { color: palette.textMuted }]}>{pendingCount} 个待完成</Text>
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
          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>全部</Text>
              <Text style={[styles.summaryValue, { color: palette.text }]}>{todos.length}</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>待完成</Text>
              <Text style={[styles.summaryValue, { color: palette.orange }]}>{pendingCount}</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>已完成</Text>
              <Text style={[styles.summaryValue, { color: palette.success }]}>{completedCount}</Text>
            </View>
          </View>
          <View style={[styles.filterTabs, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, { color: palette.textMuted }, filter === f && { color: palette.text }]}>
                  {f === 'all' ? '全部' : f === 'pending' ? '待完成' : '已完成'}
                </Text>
              </TouchableOpacity>
            ))}
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
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Skeleton width={22} height={22} borderRadius={6} />
                <View style={styles.skeletonContent}>
                  <Skeleton width="70%" height={15} />
                  <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
                </View>
                <Skeleton width={50} height={20} borderRadius={6} />
              </View>
            ))}
          </View>
        ) : (
          <PageLoadable
            loading={false}
            error={todosError}
            empty={!loading && filtered.length === 0}
            emptyIcon="check-circle-outline"
            emptyTitle={filter === 'all' ? '暂无待办事项' : filter === 'pending' ? '没有待完成的事项' : '没有已完成的事项'}
            emptyMessage="点击下方按钮添加第一个待办"
            onEmptyAction={() => router.push('/todo/create')}
            emptyActionLabel="添加待办"
            onRetry={fetchTodos}
    
          >
            {dragEnabled ? (
              <DraggableFlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderDragItem}
                onDragEnd={({ data }) => reorderTodos(data)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
              />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                removeClippedSubviews
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
          <TouchableOpacity style={[styles.sortOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowSortModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.sortModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.sortHandle, { backgroundColor: palette.borderStrong }]} />
              <Text style={[styles.sortTitle, { color: palette.text }]}>排序方式</Text>
              {([
                { key: 'time' as const, label: '添加时间', icon: 'clock-outline' },
                { key: 'priority' as const, label: '优先级', icon: 'flag-outline' },
                { key: 'title' as const, label: '名称', icon: 'sort-alphabetical-ascending' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortOption, sortBy === opt.key && { backgroundColor: palette.surfaceSoft }]}
                  onPress={() => { setSortBy(opt.key); setShowSortModal(false); }}
                >
                  <MaterialCommunityIcons name={opt.icon as any} size={20} color={sortBy === opt.key ? palette.orange : palette.textMuted} />
                  <Text style={[styles.sortOptionText, { color: palette.text }, sortBy === opt.key && { color: palette.orange }]}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.key && <MaterialCommunityIcons name="check" size={20} color={palette.orange} />}
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
          </TouchableOpacity>
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
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  title: {
    fontSize: fontSize['7xl'],
    fontWeight: fontWeight.bold,
  },
  count: {
    fontSize: fontSize.base,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryPill: {
    flex: 1,
    minHeight: 54,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    lineHeight: 16,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  filterTabs: {
    minHeight: 44,
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.lg,
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
  filterTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  todoCard: {
    minHeight: 78,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
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
  todoStatus: {
    fontSize: fontSize.sm,
    lineHeight: 18,
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
  },
  todoDate: {
    fontSize: fontSize.sm,
  },
  skeletonList: {
    padding: spacing.lg,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
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
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sortModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  sortHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sortTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xl,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sortOptionText: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
});
