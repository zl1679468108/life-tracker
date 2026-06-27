import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTodoStore } from '../../stores/todoStore';
import { LifeTodo } from '../../types';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FAB, Checkbox, Badge, EmptyState, PageLoadable, Skeleton } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';

type FilterType = 'all' | 'pending' | 'completed';
type SortType = 'time' | 'priority' | 'title';

export default function TodoListScreen() {
  const router = useRouter();
  const colors = useColors();
  const { todos, loading, error: todosError, fetchTodos, toggleComplete, deleteTodo, reorderTodos, clearError: clearTodosError } = useTodoStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('time');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);

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
  }).sort((a, b) => {
    if (sortBy === 'priority') return b.priority - a.priority;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingCount = todos.filter((t) => !t.completed).length;

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
          { backgroundColor: colors.white },
          isActive && { opacity: 0.95, ...shadows.md },
        ]}
        onLongPress={drag}
        onPress={() => router.push(`/todo/${item.id}`)}
        activeOpacity={0.98}
        disabled={isActive}
      >
        <View style={styles.todoHeader}>
          <MaterialCommunityIcons name="drag" size={20} color={colors.gray[400]} />
          <Checkbox checked={item.completed} onPress={() => toggleComplete(item.id)} />
          <View style={styles.todoContent}>
            <Text style={[styles.todoTitle, { color: colors.gray[800] }, item.completed && { textDecorationLine: 'line-through', color: colors.gray[400] }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.todoDesc, { color: colors.gray[500] }]} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Badge label={getPriorityLabel(item.priority)} variant={getPriorityVariant(item.priority)} />
        </View>
        {item.due_date && (
          <View style={styles.todoFooter}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.gray[400]} />
            <Text style={[styles.todoDate, { color: colors.gray[400] }]}>
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
        style={[styles.todoCard, { backgroundColor: colors.white }]}
        onPress={() => router.push(`/todo/${item.id}`)}
        activeOpacity={0.98}
      >
        <View style={styles.todoHeader}>
          <Checkbox checked={item.completed} onPress={() => toggleComplete(item.id)} />
          <View style={styles.todoContent}>
            <Text style={[styles.todoTitle, { color: colors.gray[800] }, item.completed && { textDecorationLine: 'line-through', color: colors.gray[400] }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.todoDesc, { color: colors.gray[500] }]} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <Badge label={getPriorityLabel(item.priority)} variant={getPriorityVariant(item.priority)} />
        </View>
        {item.due_date && (
          <View style={styles.todoFooter}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.gray[400]} />
            <Text style={[styles.todoDate, { color: colors.gray[400] }]}>
              截止: {new Date(item.due_date).toLocaleDateString('zh-CN')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  ), [colors, router, toggleComplete]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.gray[50] }]}>
      <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
        <View style={[styles.header, { backgroundColor: colors.white }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.gray[900] }]}>待办</Text>
            <View style={styles.headerActions}>
              <Text style={[styles.count, { color: colors.gray[500] }]}>{pendingCount} 个待完成</Text>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: colors.gray[100] }, dragEnabled && { backgroundColor: colors.primaryLight }]}
                onPress={() => setDragEnabled(!dragEnabled)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={dragEnabled ? 'check' : 'drag-variant'}
                  size={18}
                  color={dragEnabled ? colors.primary : colors.gray[600]}
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.gray[100] }]} onPress={() => setShowSortModal(true)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="sort" size={18} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.filterTabs, { backgroundColor: colors.gray[100] }]}>
            {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && { backgroundColor: colors.white, ...shadows.sm }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, { color: colors.gray[500] }, filter === f && { color: colors.gray[900] }]}>
                  {f === 'all' ? '全部' : f === 'pending' ? '待完成' : '已完成'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.white }]}>
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
              />
            )}
          </PageLoadable>
        )}

        <FAB variant="secondary" onPress={() => router.push('/todo/create')} />

        {showSortModal && (
          <TouchableOpacity style={styles.sortOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.sortModal, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.sortHandle, { backgroundColor: colors.gray[200] }]} />
              <Text style={[styles.sortTitle, { color: colors.gray[900] }]}>排序方式</Text>
              {([
                { key: 'time' as const, label: '添加时间', icon: 'clock-outline' },
                { key: 'priority' as const, label: '优先级', icon: 'flag-outline' },
                { key: 'title' as const, label: '名称', icon: 'sort-alphabetical-ascending' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortOption, sortBy === opt.key && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { setSortBy(opt.key); setShowSortModal(false); }}
                >
                  <MaterialCommunityIcons name={opt.icon as any} size={20} color={sortBy === opt.key ? colors.primary : colors.gray[400]} />
                  <Text style={[styles.sortOptionText, { color: colors.gray[800] }, sortBy === opt.key && { color: colors.primary }]}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.key && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['7xl'],
    fontWeight: fontWeight.bold,
  },
  count: {
    fontSize: fontSize.base,
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
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
    borderRadius: borderRadius.lg,
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
  todoTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    marginBottom: 4,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sortModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
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
