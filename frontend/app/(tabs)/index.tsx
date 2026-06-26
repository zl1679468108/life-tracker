import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useTodoStore } from '../../stores/todoStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { SafeScreen } from '../../components/SafeScreen';
import { GlobalSearch } from '../../components/GlobalSearch';
import { ExpiryWarning } from '../../components/ui';
import { useTranslation } from '../../lib/i18n';
import { api } from '../../lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const currentColors = useColors();
  const { t } = useTranslation();
  const { items, fetchItems, error: itemsError } = useItemStore();
  const { todos, fetchTodos, toggleComplete, error: todosError } = useTodoStore();
  const { getUnreadCount, loadReadIds, loaded, pushTrigger } = useNotificationStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [expiringItems, setExpiringItems] = useState<import('../../types').LifeItem[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const pendingTodos = todos.filter((t) => !t.completed).length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const unreadCount = loaded ? getUnreadCount() : 0;

  useEffect(() => {
    fetchItems();
    fetchTodos();
    loadReadIds();
    // 获取即将过期物品
    api.items.getExpiring(30).then((res) => {
      if (res.data) setExpiringItems(res.data);
    });
  }, []);

  // 铃铛抖动动画：有未读时持续抖动，每轮之间间隔 5 秒
  useEffect(() => {
    if (loaded && unreadCount > 0) {
      shakeAnimRef.current?.stop();
      shakeAnim.setValue(0);

      const shake = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]);

      // 抖动一轮(750ms) + 等待5秒(5000ms) = 5750ms 一个周期
      const loopWithDelay = Animated.sequence([
        shake,
        Animated.delay(5000),
      ]);

      shakeAnimRef.current = Animated.loop(loopWithDelay);
      shakeAnimRef.current.start();
    } else {
      shakeAnimRef.current?.stop();
      shakeAnim.setValue(0);
    }
  }, [loaded, unreadCount, pushTrigger]);

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-25deg', '0deg', '25deg'],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchTodos()]);
    // 刷新即将过期物品
    const res = await api.items.getExpiring(30);
    if (res.data) setExpiringItems(res.data);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  return (
    <SafeScreen error={itemsError || todosError}>
      <ScrollView
        style={[styles.container, { backgroundColor: currentColors.gray[50] }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[currentColors.primary]} />
        }
      >
      <View style={[styles.header, { backgroundColor: currentColors.white }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: currentColors.gray[800] }]}>{getGreeting()}</Text>
          <Text style={[styles.subtitle, { color: currentColors.gray[500] }]}>{t('home.subtitle')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: currentColors.gray[100] }]} 
            activeOpacity={0.7} 
            onPress={() => setSearchVisible(true)}
          >
            <MaterialCommunityIcons name="magnify" size={22} color={currentColors.gray[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: currentColors.gray[100] }]} activeOpacity={0.7} onPress={() => router.push('/settings/notifications')}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={currentColors.gray[600]} />
            </Animated.View>
            {unreadCount > 0 && <View style={[styles.badge, { borderColor: currentColors.white }]} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={[styles.statsCard, { backgroundColor: currentColors.white }]}>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: currentColors.primaryLight }]}
              onPress={() => router.push('/(tabs)/items')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconWrap, { backgroundColor: currentColors.primary }]}>
                <MaterialCommunityIcons name="package-variant" size={22} color={currentColors.white} />
              </View>
              <Text style={[styles.statNumber, { color: currentColors.gray[800] }]}>{items.length}</Text>
              <Text style={[styles.statLabel, { color: currentColors.gray[500] }]}>{t('home.stats.items')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: currentColors.secondaryLight }]}
              onPress={() => router.push('/(tabs)/todos')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconWrap, { backgroundColor: currentColors.secondary }]}>
                <MaterialCommunityIcons name="clock-outline" size={22} color={currentColors.white} />
              </View>
              <Text style={[styles.statNumber, { color: currentColors.gray[800] }]}>{pendingTodos}</Text>
              <Text style={[styles.statLabel, { color: currentColors.gray[500] }]}>{t('home.stats.todos')}</Text>
            </TouchableOpacity>

            <View style={[styles.statItem, { backgroundColor: currentColors.successLight }]}>
              <View style={[styles.statIconWrap, { backgroundColor: currentColors.success }]}>
                <MaterialCommunityIcons name="check-circle" size={22} color={currentColors.white} />
              </View>
              <Text style={[styles.statNumber, { color: currentColors.gray[800] }]}>{completedTodos}</Text>
              <Text style={[styles.statLabel, { color: currentColors.gray[500] }]}>{t('home.stats.completed')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentColors.gray[800] }]}>{t('home.quickActions.title')}</Text>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: currentColors.white }]} onPress={() => router.push('/item/create')} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: currentColors.primary }]}>
              <MaterialCommunityIcons name="plus" size={24} color={currentColors.white} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: currentColors.gray[800] }]}>{t('home.quickActions.addItem')}</Text>
              <Text style={[styles.actionDesc, { color: currentColors.gray[500] }]}>{t('home.quickActions.addItemDesc')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: currentColors.white }]} onPress={() => router.push('/todo/create')} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: currentColors.success }]}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={currentColors.white} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: currentColors.gray[800] }]}>{t('home.quickActions.addTodo')}</Text>
              <Text style={[styles.actionDesc, { color: currentColors.gray[500] }]}>{t('home.quickActions.addTodoDesc')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: currentColors.white }]} onPress={() => router.push('/settings/stats')} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: currentColors.secondary }]}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={currentColors.white} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: currentColors.gray[800] }]}>{t('home.quickActions.stats')}</Text>
              <Text style={[styles.actionDesc, { color: currentColors.gray[500] }]}>{t('home.quickActions.statsDesc')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: currentColors.white }]} onPress={() => router.push('/settings/notifications')} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: currentColors.secondary }]}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={currentColors.white} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: currentColors.gray[800] }]}>{t('home.quickActions.notifications')}</Text>
              <Text style={[styles.actionDesc, { color: currentColors.gray[500] }]}>{t('home.quickActions.notificationsDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {todos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentColors.gray[800] }]}>{t('home.recentTodos')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/todos')}>
              <Text style={[styles.sectionLink, { color: currentColors.primary }]}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.todoList}>
            {todos.slice(0, 3).map((todo) => (
              <TouchableOpacity
                key={todo.id}
                style={[styles.todoItem, { backgroundColor: currentColors.white }]}
                onPress={() => router.push(`/todo/${todo.id}`)}
                activeOpacity={0.7}
              >
                <TouchableOpacity onPress={() => toggleComplete(todo.id)}>
                  <View style={[styles.checkbox, { borderColor: currentColors.gray[300] }, todo.completed && { backgroundColor: currentColors.success, borderColor: currentColors.success }]}>
                    {todo.completed && (
                      <MaterialCommunityIcons name="check" size={14} color={currentColors.white} />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.todoInfo}>
                  <Text style={[styles.todoTitle, { color: currentColors.gray[800] }, todo.completed && { color: currentColors.gray[400], textDecorationLine: 'line-through' }]}>
                    {todo.title}
                  </Text>
                  {todo.description && (
                    <Text style={[styles.todoDesc, { color: currentColors.gray[500] }]} numberOfLines={1}>
                      {todo.description}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.priorityBadge,
                  todo.priority === 3 && { backgroundColor: currentColors.dangerLight },
                  todo.priority === 2 && { backgroundColor: currentColors.warningLight },
                  todo.priority === 1 && { backgroundColor: currentColors.successLight },
                ]}>
                  <Text style={[
                    styles.priorityText,
                    todo.priority === 3 && { color: currentColors.danger },
                    todo.priority === 2 && { color: currentColors.warning },
                    todo.priority === 1 && { color: currentColors.success },
                  ]}>
                    {todo.priority === 3 ? t('todos.priorityHigh') : todo.priority === 2 ? t('todos.priorityNormal') : t('todos.priorityLow')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {expiringItems.length > 0 && (
        <View style={styles.section}>
          <ExpiryWarning
            items={expiringItems}
            onPressItem={(item) => router.push(`/item/${item.id}`)}
          />
        </View>
      )}
    </ScrollView>
    <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  greeting: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.base,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', // 红色通知点，深浅模式通用
    borderWidth: 2,
  },
  statsSection: {
    padding: spacing.xl,
  },
  statsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semiBold,
  },
  sectionLink: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    padding: spacing.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {},
  actionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
  actionDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  todoList: {
    gap: spacing.md,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  todoInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  todoTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  todoDesc: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
