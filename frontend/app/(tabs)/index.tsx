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
          <View>
            <Text style={[styles.greetingTitle, { color: palette.text }]}>{greeting}</Text>
            <Text style={[styles.greetingDesc, { color: palette.textMuted }]}>今天也要加油哦</Text>
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
          <Stat label="物品总数" value={items.length} palette={palette} onPress={() => router.push('/item/list')} />
          <Stat label="待办未完成" value={pendingTodos} palette={palette} onPress={() => router.push('/todo/list')} />
          <Stat label="已完成" value={completedTodos} palette={palette} />
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: palette.orange }]}
            onPress={() => router.push('/item/create')}
            activeOpacity={0.84}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
            <Text style={styles.quickTitle}>添加物品</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: palette.violet }]}
            onPress={() => router.push('/todo/create')}
            activeOpacity={0.84}
          >
            <MaterialCommunityIcons name="check" size={26} color="#FFFFFF" />
            <Text style={styles.quickTitle}>添加待办</Text>
          </TouchableOpacity>
        </View>

        {recentTodos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>最近待办</Text>
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
                  <Text style={[styles.todoDesc, { color: palette.textMuted }]} numberOfLines={1}>
                    {todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '未设置日期'} · {priorityText(todo.priority)}
                  </Text>
                </View>
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
  onPress,
}: {
  label: string;
  value: number;
  palette: typeof appDesign.dark;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statMeta, { color: palette.textMuted }]}>{onPress ? '点击查看' : '今日记录'}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 112,
  },
  greetingBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greetingTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: fontWeight.bold,
  },
  greetingDesc: {
    fontSize: fontSize.base,
    lineHeight: 20,
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
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: fontSize.sm,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.extraBold,
  },
  statMeta: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.bold,
  },
  todoRow: {
    minHeight: 66,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
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
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  todoDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
});
