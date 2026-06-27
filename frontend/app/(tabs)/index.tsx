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
import { ExpiryWarning } from '../../components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { api } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { useItemStore } from '../../stores/itemStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useTodoStore } from '../../stores/todoStore';

const screen = {
  background: '#0F1724',
  header: '#000000',
  panel: '#000000',
  text: '#FFFFFF',
  muted: '#9CA3AF',
  orange: '#FF8754',
  purple: '#8B68F5',
  green: '#32D296',
  amber: '#FBB329',
  iconButton: '#1F2937',
  todoBorder: '#546277',
  danger: '#FF6B7A',
  dangerBg: '#461B20',
};

type Tone = 'orange' | 'purple' | 'green';

const toneMap: Record<Tone, { accent: string; surface: string }> = {
  orange: { accent: screen.orange, surface: '#351F18' },
  purple: { accent: screen.purple, surface: '#211B3D' },
  green: { accent: screen.green, surface: '#0D351F' },
};

function StatCard({
  icon,
  value,
  label,
  tone,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  tone: Tone;
  onPress?: () => void;
}) {
  const colors = toneMap[tone];
  const content = (
    <>
      <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
        <MaterialCommunityIcons name={icon} size={24} color="#000000" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.statCard, { backgroundColor: colors.surface }]}>{content}</View>;
  }

  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {content}
    </TouchableOpacity>
  );
}

function QuickAction({
  icon,
  title,
  description,
  tone,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  tone: 'orange' | 'green' | 'purple';
  onPress: () => void;
}) {
  const accent = toneMap[tone].accent;

  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.actionIcon, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={icon} size={28} color="#000000" />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { items, fetchItems, error: itemsError } = useItemStore();
  const { todos, fetchTodos, toggleComplete, error: todosError } = useTodoStore();
  const { getUnreadCount, loadReadIds, loaded, pushTrigger } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [expiringItems, setExpiringItems] = useState<import('../../types').LifeItem[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const pendingTodos = todos.filter((todo) => !todo.completed).length;
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const unreadCount = loaded ? getUnreadCount() : 0;
  const recentTodos = [...todos]
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 3);

  useEffect(() => {
    fetchItems();
    fetchTodos();
    loadReadIds();
    api.items.getExpiring(30).then((res) => {
      if (res.data) setExpiringItems(res.data);
    });
  }, []);

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

      shakeAnimRef.current = Animated.loop(Animated.sequence([shake, Animated.delay(5000)]));
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

  const getPriorityLabel = (priority: number) => {
    if (priority >= 3) return t('todos.priorityHigh');
    if (priority === 2) return t('todos.priorityNormal');
    return t('todos.priorityLow');
  };

  return (
    <SafeScreen backgroundColor={screen.background} error={itemsError || todosError}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={screen.orange} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.78} onPress={() => setSearchVisible(true)}>
              <MaterialCommunityIcons name="magnify" size={31} color="#D5DCE7" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.78}
              onPress={() => router.push('/settings/notifications')}
            >
              <Animated.View style={{ transform: [{ rotate }] }}>
                <MaterialCommunityIcons name="bell-outline" size={31} color="#D5DCE7" />
              </Animated.View>
              {unreadCount > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.statsShell}>
            <View style={styles.statsRow}>
              <StatCard
                icon="package-variant"
                value={items.length}
                label={t('home.stats.items')}
                tone="orange"
                onPress={() => router.push('/item/list')}
              />
              <StatCard
                icon="clock-outline"
                value={pendingTodos}
                label={t('home.stats.todos')}
                tone="purple"
                onPress={() => router.push('/todo/list')}
              />
              <StatCard
                icon="check-circle"
                value={completedTodos}
                label={t('home.stats.completed')}
                tone="green"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.quickActions.title')}</Text>
            <View style={styles.actionsGrid}>
              <QuickAction
                icon="plus"
                title={t('home.quickActions.addItem')}
                description={t('home.quickActions.addItemDesc')}
                tone="orange"
                onPress={() => router.push('/item/create')}
              />
              <QuickAction
                icon="plus-circle-outline"
                title={t('home.quickActions.addTodo')}
                description={t('home.quickActions.addTodoDesc')}
                tone="green"
                onPress={() => router.push('/todo/create')}
              />
              <QuickAction
                icon="chart-bar"
                title={t('home.quickActions.stats')}
                description={t('home.quickActions.statsDesc')}
                tone="purple"
                onPress={() => router.push('/settings/stats')}
              />
              <QuickAction
                icon="bell-outline"
                title={t('home.quickActions.notifications')}
                description={t('home.quickActions.notificationsDesc')}
                tone="purple"
                onPress={() => router.push('/settings/notifications')}
              />
            </View>
          </View>

          {recentTodos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.recentTodos')}</Text>
                <TouchableOpacity onPress={() => router.push('/todo/list')} activeOpacity={0.75}>
                  <Text style={styles.sectionLink}>{t('home.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.todoList}>
                {recentTodos.map((todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    style={styles.todoItem}
                    onPress={() => router.push(`/todo/${todo.id}`)}
                    activeOpacity={0.82}
                  >
                    <TouchableOpacity onPress={() => toggleComplete(todo.id)} activeOpacity={0.75}>
                      <View style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
                        {todo.completed && <MaterialCommunityIcons name="check" size={18} color="#000000" />}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.todoInfo}>
                      <Text style={[styles.todoTitle, todo.completed && styles.todoTitleDone]} numberOfLines={1}>
                        {todo.title}
                      </Text>
                      {!!todo.description && (
                        <Text style={styles.todoDesc} numberOfLines={1}>
                          {todo.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>{getPriorityLabel(todo.priority)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {expiringItems.length > 0 && (
            <View style={styles.expirySection}>
              <ExpiryWarning items={expiringItems} onPressItem={(item) => router.push(`/item/${item.id}`)} />
            </View>
          )}
        </View>
      </ScrollView>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: screen.background,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    minHeight: 136,
    backgroundColor: screen.header,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  greeting: {
    color: screen.text,
    fontSize: 30,
    fontWeight: fontWeight.extraBold,
    lineHeight: 36,
  },
  subtitle: {
    color: '#BCC4D0',
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.xs,
  },
  iconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: screen.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 13,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F05252',
    borderWidth: 2,
    borderColor: screen.iconButton,
  },
  main: {
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['3xl'],
  },
  statsShell: {
    backgroundColor: screen.panel,
    borderRadius: 30,
    padding: spacing['3xl'],
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 176,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  statIcon: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    color: screen.text,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: fontWeight.extraBold,
  },
  statLabel: {
    color: '#AFB7C3',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: screen.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeight.extraBold,
    marginBottom: spacing.lg,
  },
  sectionLink: {
    color: screen.orange,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extraBold,
    padding: spacing.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  actionCard: {
    width: '47.8%',
    minHeight: 200,
    backgroundColor: screen.panel,
    borderRadius: borderRadius['2xl'],
    padding: spacing['3xl'],
    justifyContent: 'center',
  },
  actionIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    color: screen.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: fontWeight.extraBold,
  },
  actionDesc: {
    color: screen.muted,
    fontSize: fontSize['4xl'],
    lineHeight: 23,
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.xs,
  },
  todoList: {
    gap: spacing.lg,
  },
  todoItem: {
    minHeight: 104,
    backgroundColor: screen.panel,
    borderRadius: 24,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: screen.todoBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: screen.green,
    borderColor: screen.green,
  },
  todoInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  todoTitle: {
    color: screen.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: fontWeight.extraBold,
  },
  todoTitleDone: {
    color: screen.muted,
    textDecorationLine: 'line-through',
  },
  todoDesc: {
    color: '#B4BCC8',
    fontSize: fontSize['4xl'],
    lineHeight: 23,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  priorityBadge: {
    backgroundColor: screen.dangerBg,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.md,
  },
  priorityText: {
    color: screen.danger,
    fontSize: fontSize.lg,
    lineHeight: 18,
    fontWeight: fontWeight.extraBold,
  },
  expirySection: {
    marginBottom: spacing.xl,
  },
});
