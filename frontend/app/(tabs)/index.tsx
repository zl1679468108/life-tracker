import React, { useEffect, useState } from 'react';
import {
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
import { SafeScreen } from '../../components/SafeScreen';
import { GlobalSearch } from '../../components/GlobalSearch';
import { AppHeader, HomeBackground } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useItemStore } from '../../stores/itemStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useTodoStore } from '../../stores/todoStore';
import { useColors } from '../../stores/themeStore';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const isDark = palette.bg === appDesign.dark.bg;
  const { items, fetchItems, error: itemsError } = useItemStore();
  const { todos, fetchTodos, error: todosError } = useTodoStore();
  const { getUnreadCount, loaded } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const pendingTodos = todos.filter((todo) => !todo.completed).length;
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const unreadCount = loaded ? getUnreadCount() : 0;

  const quickActions = [
    { title: '添加物品', icon: 'plus', color: palette.orange, route: '/item/create' as const, hint: '记录新物品' },
    { title: '添加待办', icon: 'check', color: palette.violet, route: '/todo/create' as const, hint: '安排今天事项' },
  ];

  useEffect(() => {
    fetchItems();
    fetchTodos();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchTodos()]);
    setRefreshing(false);
  };

  return (
    <SafeScreen backgroundColor={palette.bg} error={itemsError || todosError}>
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
          <AppHeader
            title="今日总览"
            actions={[
              { icon: 'magnify', label: '搜索', onPress: () => setSearchVisible(true) },
              { icon: 'bell-outline', label: '通知中心', onPress: () => router.push('/settings/notifications'), unreadDot: unreadCount > 0 },
            ]}
          />
        </View>
        <ScrollView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.orange} />}
        >

        <View style={styles.stats}>
          <Stat label="物品总数" value={items.length} palette={palette} meta="管理中" onPress={() => router.push('/item/list')} />
          <Stat label="待办未完成" value={pendingTodos} palette={palette} meta="优先处理" onPress={() => router.push('/todo/list')} />
          <Stat label="已完成" value={completedTodos} palette={palette} meta="今日记录" />
        </View>

        <View style={styles.section}>
          <View style={[styles.quickCard, { backgroundColor: palette.surface, borderColor: palette.border, ...shadows.md }]}>
            <TouchableOpacity
              style={styles.quickHalf}
              onPress={() => router.push(quickActions[0].route)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: `${palette.orange}18` }]}>
                <MaterialCommunityIcons name="plus" size={22} color={palette.orange} />
              </View>
              <View style={styles.quickText}>
                <Text style={[styles.quickTitle, { color: palette.text }]}>添加物品</Text>
                <Text style={[styles.quickHint, { color: palette.textMuted }]}>记录新物品</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={[styles.quickDivider, { backgroundColor: palette.border }]} />
            <TouchableOpacity
              style={styles.quickHalf}
              onPress={() => router.push(quickActions[1].route)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: `${palette.violet}18` }]}>
                <MaterialCommunityIcons name="check" size={22} color={palette.violet} />
              </View>
              <View style={styles.quickText}>
                <Text style={[styles.quickTitle, { color: palette.text }]}>添加待办</Text>
                <Text style={[styles.quickHint, { color: palette.textMuted }]}>安排今天事项</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
    </SafeScreen>
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
  palette: typeof appDesign.dark;
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
        { backgroundColor: palette.surface, borderColor: palette.border, ...shadows.md },
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
        <Text style={[styles.statLabel, { color: palette.textMuted }]}>{label}</Text>
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
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 8,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextBlock: {
    gap: 3,
  },
  statLabel: {
    fontSize: fontSize.sm,
    lineHeight: 16,
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
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  quickHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
});
