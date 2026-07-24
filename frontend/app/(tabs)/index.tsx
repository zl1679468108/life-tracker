import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlobalSearch } from '../../components/GlobalSearch';
import { AppScreen, HomeBackground, InlineEmptyState } from '../../components/ui';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useItemStore } from '../../stores/itemStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useTodoStore } from '../../stores/todoStore';
import { useColors, usePalette, useTheme, type AppPalette } from '../../stores/themeStore';
import { formatDateZh } from '../../lib/format';
import type { LifeItem, LifeTodo } from '../../types';
const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = usePalette();
  const { isDark } = useTheme();
  const { items, fetchItems, error: itemsError } = useItemStore();
  const { todos, fetchTodos, toggleComplete, error: todosError } = useTodoStore();
  const { getUnreadCount, loaded } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [celebratedId, setCelebratedId] = useState<string | null>(null);
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const celebrateScale = useRef(new Animated.Value(0)).current;
  const celebrateOpacity = useRef(new Animated.Value(0)).current;

  const triggerCelebration = useCallback((todoId: string) => {
    setCelebratedId(todoId);
    celebrateOpacity.setValue(1);
    celebrateScale.setValue(0.3);
    Animated.parallel([
      Animated.spring(celebrateScale, { toValue: 1.3, damping: 8, stiffness: 200, useNativeDriver: true }),
      Animated.timing(celebrateOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      setCelebratedId(null);
      celebrateScale.setValue(0);
      celebrateOpacity.setValue(0);
    });
  }, []);

  const handleToggleComplete = useCallback(async (todo: LifeTodo) => {
    if (todo.completed) return;
    await toggleComplete(todo.id);
    triggerCelebration(todo.id);
  }, [toggleComplete, triggerCelebration]);

  // 统计值 memo 化，避免每次渲染都重新计算
  const pendingTodos = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);
  const completedTodos = useMemo(() => todos.filter((todo) => todo.completed).length, [todos]);
  const unreadCount = loaded ? getUnreadCount() : 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 19) return '下午好';
    return '晚上好';
  }, []);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const isOverdueTodo = (todo: LifeTodo) => {
    if (todo.completed || !todo.due_date) return false;
    const due = new Date(todo.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isTodayTodo = (todo: LifeTodo) => {
    if (todo.completed || !todo.due_date) return false;
    const due = new Date(todo.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  };

  const expiringItems = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return items.filter((item) => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      return expiry >= now && expiry <= nextWeek;
    });
  }, [items]);

  const overdueTodos = useMemo(() => todos.filter(isOverdueTodo), [todos, today]);
  const todayTodos = useMemo(() => todos.filter(isTodayTodo), [todos, today]);

  const actionItems = useMemo(() => {
    const actions: { type: 'todo' | 'item'; title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; data: LifeTodo | LifeItem; urgent?: boolean }[] = [];
    overdueTodos.slice(0, 2).forEach((todo) => {
      actions.push({
        type: 'todo',
        title: todo.title,
        subtitle: '已逾期',
        icon: 'alert-circle',
        color: palette.danger,
        data: todo,
        urgent: true,
      });
    });
    todayTodos.slice(0, 2).forEach((todo) => {
      actions.push({
        type: 'todo',
        title: todo.title,
        subtitle: '今天截止',
        icon: 'calendar-today',
        color: palette.warning,
        data: todo,
      });
    });
    expiringItems.slice(0, 2).forEach((item) => {
      actions.push({
        type: 'item',
        title: item.name,
        subtitle: '即将过期',
        icon: 'clock-alert-outline',
        color: palette.warning,
        data: item,
      });
    });
    return actions;
  }, [overdueTodos, todayTodos, expiringItems, palette]);

  const recentTodos = useMemo(() => {
    return todos
      .filter((todo) => !todo.completed)
      .sort((a, b) => {
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      })
      .slice(0, 3);
  }, [todos]);

  useEffect(() => {
    fetchItems();
    fetchTodos();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchTodos()]);
    setRefreshing(false);
  };

  const quickActions = [
    { title: '添加物品', icon: 'plus', color: palette.orange, route: '/item/create' as const, hint: '记录新物品' },
    { title: '添加待办', icon: 'check', color: palette.violet, route: '/todo/create' as const, hint: '安排今天事项' },
  ] as const;

  return (
    <AppScreen scroll={false} padded={false} error={itemsError || todosError}>
      <View style={styles.pageWrap}>
        {/* 氛围背景层：渐变 + 漂浮装饰 */}
        <View style={styles.atmosphereArea} pointerEvents="none">
          <LinearGradient
            colors={isDark
              ? ['rgba(243,111,60,0.12)', 'rgba(243,111,60,0.04)', palette.bg]
              : ['#FFF0E9', '#FFF6F0', palette.bg]
            }
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <HomeBackground style={styles.decorations} />
        </View>

        <View style={[styles.stickyHeader, { backgroundColor: 'transparent' }]}>
          <View style={[styles.homeHeader, { minHeight: 44 }]}>
            <View style={styles.homeHeaderTitle}>
              <Text style={[styles.homeHeaderTitleText, { color: palette.text }]}>{greeting}，</Text>
              <Text style={[styles.homeHeaderSubtitle, { color: palette.textMuted }]}>今天也要加油哦</Text>
            </View>
            <View style={styles.homeHeaderActions}>
              <TouchableOpacity
                style={[styles.homeHeaderIcon, { backgroundColor: palette.surfaceSoft }]}
                onPress={() => setSearchVisible(true)}
                activeOpacity={0.78}
              >
                <MaterialCommunityIcons name="magnify" size={20} color={palette.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.homeHeaderIcon, { backgroundColor: palette.surfaceSoft }]}
                onPress={() => router.push('/settings/notifications')}
                activeOpacity={0.78}
              >
                <MaterialCommunityIcons name="bell-outline" size={20} color={palette.textSecondary} />
                {unreadCount > 0 && <View style={[styles.homeHeaderDot, { backgroundColor: palette.danger, borderColor: palette.surfaceSoft }]} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <ScrollView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.orange} />}
        >

          {/* 今天要看 — 统一主卡片 */}
          {actionItems.length > 0 && (
            <View style={styles.section}>
              <View
                style={[
                  styles.actionPanel,
                  { backgroundColor: palette.surface },
                  !isDark && shadows.sm,
                ]}
              >
                <View style={styles.actionHeader}>
                  <Text style={[styles.actionHeaderTitle, { color: palette.text }]}>今天要看</Text>
                  <View style={[styles.actionHeaderBadge, { backgroundColor: palette.surfaceSoft }]}>
                    <Text style={[styles.actionHeaderBadgeText, { color: palette.textMuted }]}>{actionItems.length} 项</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.actionScroll}
                  snapToInterval={204}
                  decelerationRate="fast"
                >
                  {actionItems.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.type}-${item.data.id}-${index}`}
                      style={[
                        styles.actionCard,
                        { backgroundColor: palette.surface },
                      ]}
                      onPress={() => router.push(item.type === 'todo' ? `/todo/${item.data.id}` : `/item/${item.data.id}`)}
                      activeOpacity={0.88}
                    >
                      {/* accent stripe */}
                      <View style={[styles.cardAccent, { backgroundColor: item.color }]} />

                      <View style={styles.cardInner}>
                        <View style={[styles.cardAvatar, { backgroundColor: `${item.color}18` }]}>
                          <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
                        </View>
                        <View style={styles.cardText}>
                          <Text style={[styles.cardTitle, { color: palette.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.cardMeta}>
                            <View style={[styles.cardTag, { backgroundColor: item.urgent ? `${palette.danger}20` : `${item.color}18` }]}>
                              <Text style={[styles.cardTagText, { color: item.urgent ? palette.danger : item.color }]}>
                                {item.subtitle}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* dot indicators */}
                {actionItems.length > 1 && (
                  <View style={styles.dotRow}>
                    {actionItems.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: i === 0 ? palette.orange : 'rgba(0,0,0,0.12)' },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.stats}>
            <Stat label="物品总数" value={items.length} palette={palette} meta="管理中" onPress={() => router.push('/item/list')} />
            <Stat label="待办未完成" value={pendingTodos} palette={palette} meta="优先处理" onPress={() => router.push('/todo/list?filter=pending')} />
            <Stat label="已完成" value={completedTodos} palette={palette} meta="总已完成" />
          </View>

          <View style={styles.section}>
            <View
              style={[
                styles.quickCard,
                { backgroundColor: palette.surface },
                !isDark && shadows.sm,
              ]}
            >
              <View style={styles.quickHeader}>
                <Text style={[styles.quickHeaderTitle, { color: palette.text }]}>快捷操作</Text>
              </View>
              <View style={styles.quickDual}>
                {quickActions.map((action, index) => (
                  <React.Fragment key={action.title}>
                    {index > 0 && <View style={[styles.quickInnerDivider, { backgroundColor: palette.border }]} />}
                    <TouchableOpacity
                      style={[
                        styles.quickHalf,
                        { backgroundColor: isDark ? `${action.color}18` : `${action.color}12` },
                      ]}
                      onPress={() => router.push(action.route)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.quickIconCircle, { backgroundColor: action.color, shadowColor: action.color }]}>
                        <MaterialCommunityIcons name={action.icon as any} size={22} color="#FFFFFF" />
                      </View>
                      <View style={styles.quickText}>
                        <Text style={[styles.quickTitle, { color: palette.text }]}>{action.title}</Text>
                        <Text style={[styles.quickHint, { color: palette.textMuted }]}>{action.hint}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={action.color} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View
              style={[
                styles.todoPanel,
                { backgroundColor: palette.surface },
                !isDark && shadows.sm,
              ]}
            >
              <View style={styles.todoHeader}>
                <Text style={[styles.todoHeaderTitle, { color: palette.text }]}>最近待办</Text>
                <TouchableOpacity onPress={() => router.push('/todo/list')} activeOpacity={0.7} style={styles.todoHeaderLink}>
                  <Text style={[styles.todoHeaderLinkText, { color: palette.orange }]}>查看全部</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={palette.orange} />
                </TouchableOpacity>
              </View>
              {recentTodos.length > 0 ? (
                recentTodos.map((todo, index) => (
                  <TouchableOpacity
                    key={todo.id}
                    style={[
                      styles.todoRow,
                      index < recentTodos.length - 1 && { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                    onPress={() => router.push(`/todo/${todo.id}`)}
                    activeOpacity={0.82}
                  >
                    <TouchableOpacity
                      style={[
                        styles.todoCheck,
                        { borderColor: todo.priority === 3 ? palette.danger : todo.priority === 2 ? palette.warning : palette.success },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(todo);
                      }}
                      activeOpacity={0.7}
                    >
                      {todo.completed && (
                        <MaterialCommunityIcons
                          name="check"
                          size={14}
                          color={todo.priority === 3 ? palette.danger : todo.priority === 2 ? palette.warning : palette.success}
                        />
                      )}
                    </TouchableOpacity>
                    <View style={styles.todoText}>
                      <Text style={[styles.todoTitle, { color: palette.text }]} numberOfLines={1}>{todo.title}</Text>
                      {todo.due_date && (
                        <Text style={[styles.todoDue, { color: isOverdueTodo(todo) ? palette.danger : palette.textMuted }]}>
                          {isOverdueTodo(todo) ? '已逾期' : isTodayTodo(todo) ? '今天' : formatDateZh(todo.due_date)}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={palette.textMuted} />
                  </TouchableOpacity>
                ))
              ) : (
                <InlineEmptyState title="暂无待办" />
              )}
            </View>

            {/* celebration animation overlay */}
            {celebratedId && (
              <View style={styles.celebrationOverlay} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.celebrationBadge,
                    {
                      backgroundColor: palette.success,
                      opacity: celebrateOpacity,
                      transform: [{ scale: celebrateScale }],
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="check-circle" size={36} color="#FFF" />
                  <Text style={styles.celebrationText}>已完成</Text>
                </Animated.View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </AppScreen>
  );
}

function Stat({
  label,
  value,
  palette,
  meta,
  onPress,
}: {
  label: string;
  value: number;
  palette: AppPalette;
  meta: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const iconColor = label === '物品总数' ? palette.orange : label === '待办未完成' ? palette.warning : palette.success;
  const iconName = label === '物品总数' ? 'package-variant-closed' : label === '待办未完成' ? 'checkbox-marked-circle-outline' : 'check-circle-outline';
  const iconBg = label === '物品总数' ? `${palette.orange}18` : label === '待办未完成' ? `${palette.warning}18` : `${palette.success}18`;
  return (
    <Wrapper
      style={[
        styles.statCard,
        { backgroundColor: palette.surface, ...shadows.sm },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.statTop}>
        <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
        </View>
        <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
      </View>
      <View style={styles.statTextBlock}>
        <Text style={[styles.statLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.statMeta, { color: palette.textMuted }]}>{meta}</Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
  },
  atmosphereArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  decorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  stickyHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    zIndex: 10,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 112,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  homeHeaderTitle: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  homeHeaderTitleText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.bold,
  },
  homeHeaderSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  homeHeaderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  homeHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  homeHeaderDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  sectionMeta: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  cardAccent: {
    height: 2,
  },
  cardInner: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
  actionPanel: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
  },
  actionHeaderTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  actionHeaderBadge: {
    minWidth: 26,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionHeaderBadgeText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.semiBold,
  },
  actionScroll: {
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 10,
  },
  actionCard: {
    width: 188,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 6,
  },  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextBlock: {
    gap: 3,
  },
  statLabel: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: fontWeight.extraBold,
  },
  statMeta: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  quickCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
  },
  quickHeaderTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  quickDual: {
    flexDirection: 'row',
  },
  quickInnerDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  quickHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  quickText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  quickTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  quickHint: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  todoPanel: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
  },
  todoHeaderTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  todoHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  todoHeaderLinkText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  todoCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoText: {
    flex: 1,
    minWidth: 0,
  },
  todoTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  todoDue: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
});
