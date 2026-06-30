import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../components/SafeScreen';
import { GlobalSearch } from '../../components/GlobalSearch';
import { AppHeader } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { api } from '../../lib/api';
import { useItemStore } from '../../stores/itemStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useTodoStore } from '../../stores/todoStore';
import { useColors } from '../../stores/themeStore';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { items, fetchItems, error: itemsError } = useItemStore();
  const { todos, fetchTodos, toggleComplete, error: todosError } = useTodoStore();
  const { getUnreadCount, loadReadIds, loaded, pushTrigger, refreshNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const pendingTodos = todos.filter((todo) => !todo.completed).length;
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const unreadCount = loaded ? getUnreadCount() : 0;
  const recentTodos = [...todos]
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 3);
  const recentTodoCountLabel = `${recentTodos.length} 条`;
  const quickActions = [
    { title: '添加物品', icon: 'plus', color: palette.orange, route: '/item/create' as const, hint: '记录新物品' },
    { title: '添加待办', icon: 'check', color: palette.violet, route: '/todo/create' as const, hint: '安排今天事项' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  useEffect(() => {
    fetchItems();
    fetchTodos();
    loadReadIds();
    api.items.getExpiring(30).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (loaded) {
      refreshNotifications();
    }
  }, [loaded, items.length, todos.length, pushTrigger]);

  useEffect(() => {
    if (loaded && unreadCount > 0) {
      shakeAnimRef.current?.stop();
      shakeAnim.setValue(0);
      const shake = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]);
      shakeAnimRef.current = Animated.loop(Animated.sequence([shake, Animated.delay(5000)]));
      shakeAnimRef.current.start();
    } else {
      shakeAnimRef.current?.stop();
      shakeAnim.setValue(0);
    }
  }, [loaded, unreadCount, pushTrigger]);

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchTodos()]);
    setRefreshing(false);
  };

  const priorityText = (priority: number) => {
    if (priority >= 3) return '紧急';
    if (priority === 2) return '普通';
    return '低';
  };

  return (
    <SafeScreen backgroundColor={palette.bg} error={itemsError || todosError}>
      <ScrollView
        style={[styles.container, { backgroundColor: palette.bg }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.orange} />}
      >
        <AppHeader
          title="今日总览"
          actions={[
            { icon: 'magnify', label: '搜索', onPress: () => setSearchVisible(true) },
          ]}
        />

        <View style={styles.greetingBlock}>
          <View style={styles.greetingCopy}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingText}>
                <Text style={[styles.greetingTitle, { color: palette.text }]}>{greeting}</Text>
                <Text style={[styles.greetingDesc, { color: palette.textMuted }]}>今天也要加油哦</Text>
              </View>
              <View style={[styles.greetingBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <Text style={[styles.greetingBadgeValue, { color: palette.orange }]}>{pendingTodos}</Text>
                <Text style={[styles.greetingBadgeLabel, { color: palette.textMuted }]}>待完成</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
            activeOpacity={0.78}
            onPress={() => router.push('/settings/notifications')}
            accessibilityRole="button"
            accessibilityLabel="通知中心"
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={palette.textSecondary} />
            </Animated.View>
            {unreadCount > 0 && <View style={[styles.unreadDot, { backgroundColor: palette.danger }]} />}
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <Stat label="物品总数" value={items.length} palette={palette} meta="管理中" onPress={() => router.push('/item/list')} />
          <Stat label="待办未完成" value={pendingTodos} palette={palette} meta="优先处理" onPress={() => router.push('/todo/list')} tone="accent" />
          <Stat label="已完成" value={completedTodos} palette={palette} meta="今日记录" />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>快捷操作</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={[styles.quickCard, { backgroundColor: action.color }]}
                onPress={() => router.push(action.route)}
                activeOpacity={0.84}
              >
                <View style={styles.quickCardTop}>
                  <View style={styles.quickIconWrap}>
                    <MaterialCommunityIcons name={action.icon as any} size={22} color="#FFFFFF" />
                  </View>
                  <MaterialCommunityIcons name="arrow-top-right" size={18} color="rgba(255,255,255,0.86)" />
                </View>
                <View style={styles.quickCardText}>
                  <Text style={styles.quickTitle}>{action.title}</Text>
                  <Text style={styles.quickHint}>{action.hint}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {recentTodos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionHeadMain}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>最近待办</Text>
                <View style={[styles.sectionCountBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <Text style={[styles.sectionCountText, { color: palette.textMuted }]}>{recentTodoCountLabel}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push('/todo/list')} activeOpacity={0.75}>
                <Text style={[styles.sectionLink, { color: palette.orange }]}>查看全部</Text>
              </TouchableOpacity>
            </View>
            {recentTodos.map((todo) => (
              <TouchableOpacity
                key={todo.id}
                style={[styles.todoRow, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => router.push(`/todo/${todo.id}`)}
                activeOpacity={0.82}
              >
                <TouchableOpacity onPress={() => toggleComplete(todo.id)} activeOpacity={0.75}>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: todo.completed ? palette.success : palette.borderStrong },
                      todo.completed && { backgroundColor: palette.success },
                    ]}
                  >
                    {todo.completed && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
                <View style={styles.todoContent}>
                  <Text
                    style={[styles.todoTitle, { color: todo.completed ? palette.textDisabled : palette.text }]}
                    numberOfLines={1}
                  >
                    {todo.title}
                  </Text>
                  <View style={styles.todoMetaRow}>
                    <Text style={[styles.todoDesc, { color: palette.textMuted }]} numberOfLines={1}>
                      {todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '未设置日期'}
                    </Text>
                    <View style={[styles.todoPriorityBadge, { backgroundColor: palette.surfaceSoft }]}>
                      <Text style={[styles.todoPriorityText, { color: palette.textSecondary }]}>{priorityText(todo.priority)}</Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </SafeScreen>
  );
}

function Stat({
  label,
  value,
  palette,
  meta,
  onPress,
  tone = 'default',
}: {
  label: string;
  value: number;
  palette: typeof appDesign.dark;
  meta: string;
  onPress?: () => void;
  tone?: 'default' | 'accent';
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const isAccent = tone === 'accent';
  return (
    <Wrapper
      style={[
        styles.statCard,
        {
          backgroundColor: isAccent ? '#FFF4EC' : palette.surface,
          borderColor: isAccent ? palette.orange : palette.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: isAccent ? palette.orange : palette.text }]}>{value}</Text>
      <Text style={[styles.statMeta, { color: palette.textMuted }]}>{meta}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 112,
  },
  greetingBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  greetingCopy: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  greetingText: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  greetingDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
  greetingBadge: {
    minWidth: 70,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  greetingBadgeValue: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  greetingBadgeLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    minHeight: 80,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: fontSize.sm,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: fontWeight.extraBold,
  },
  statMeta: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  quickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickIconWrap: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardText: {
    gap: 2,
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  quickHint: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  section: {
    marginTop: 2,
    marginBottom: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeadMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  sectionCountBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionCountText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.semiBold,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.bold,
  },
  todoRow: {
    minHeight: 58,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  todoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
  },
  todoDesc: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  todoPriorityBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todoPriorityText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.semiBold,
  },
});
