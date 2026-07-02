import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { showAlert } from '../../lib/alert';
import type { WidgetStatsData, WidgetTodoData } from '../../types';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

export default function WidgetsScreen() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [stats, setStats] = useState<WidgetStatsData | null>(null);
  const [todos, setTodos] = useState<WidgetTodoData[]>([]);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    const [statsRes, todosRes] = await Promise.all([api.widgets.stats(), api.widgets.todos(5)]);
    if (statsRes.data) setStats(statsRes.data);
    if (todosRes.data?.todos) setTodos(todosRes.data.todos);
  };

  const handleInstallPWA = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.deferredPrompt) {
        // @ts-ignore
        window.deferredPrompt.prompt();
      } else {
        showAlert('安装提示', '请在浏览器菜单中选择“安装应用”');
      }
      return;
    }
    showAlert('安装提示', '当前平台可通过系统桌面小组件或快捷方式访问 LifeTracker。');
  };

  const priorityColors: Record<number, string> = {
    1: palette.success,
    2: palette.warning,
    3: palette.danger,
  };
  const priorityLabels: Record<number, string> = { 1: '低', 2: '中', 3: '高' };

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>桌面小组件</Text>
          </View>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>预览卡片</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>快速统计</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>模拟桌面首屏信息</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statTile, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="package-variant-closed" size={20} color={palette.orange} />
            <Text style={[styles.statValue, { color: palette.text }]}>{stats?.items_count || 0}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>物品</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.success} />
            <Text style={[styles.statValue, { color: palette.text }]}>{stats?.todos_completed || 0}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>已完成</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={palette.warning} />
            <Text style={[styles.statValue, { color: palette.text }]}>{stats?.todos_pending || 0}</Text>
            <Text style={[styles.statLabel, { color: palette.textMuted }]}>待完成</Text>
          </View>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>待办预览</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>待办事项 TOP 5</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>优先展示最近需要处理的任务</Text>
        </View>

        {todos.length === 0 ? (
          <View style={[styles.emptyPanel, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color={palette.textMuted} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>暂无待办</Text>
            <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>添加待办后，这里会生成适合小组件展示的摘要列表。</Text>
          </View>
        ) : (
          <View style={styles.todoList}>
            {todos.map((todo) => (
              <View key={todo.id} style={[styles.todoRow, { borderColor: palette.border }]}>
                <View style={[styles.todoIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <MaterialCommunityIcons
                    name={todo.completed ? 'check' : 'checkbox-blank-circle-outline'}
                    size={16}
                    color={todo.completed ? palette.success : palette.textMuted}
                  />
                </View>
                <View style={styles.todoCopy}>
                  <Text
                    style={[styles.todoTitle, { color: todo.completed ? palette.textMuted : palette.text }]}
                    numberOfLines={1}
                  >
                    {todo.title}
                  </Text>
                  <Text style={[styles.todoMeta, { color: palette.textMuted }]}>
                    {todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '未设置日期'}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColors[todo.priority]}20` }]}>
                  <Text style={[styles.priorityText, { color: priorityColors[todo.priority] }]}>
                    {priorityLabels[todo.priority]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.installCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        onPress={handleInstallPWA}
        activeOpacity={0.82}
      >
        <View style={[styles.installIconWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons
            name={Platform.OS === 'web' ? 'monitor-arrow-down' : 'widgets-outline'}
            size={20}
            color={palette.violet}
          />
        </View>
        <View style={styles.installCopy}>
          <Text style={[styles.installTitle, { color: palette.text }]}>
            {Platform.OS === 'web' ? '安装到桌面' : '系统快捷入口'}
          </Text>
          <Text style={[styles.installDesc, { color: palette.textMuted }]}>
            {Platform.OS === 'web'
              ? '将 LifeTracker 安装为桌面应用，获得更接近原生小组件的访问体验。'
              : '当前平台通过系统桌面快捷方式或原生小组件承载 LifeTracker 快速入口。'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
      </TouchableOpacity>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: palette.textSecondary }]}>使用说明</Text>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>关于桌面小组件</Text>
          </View>
          <Text style={[styles.sectionMeta, { color: palette.textMuted }]}>
            {Platform.OS === 'web' ? 'PWA 体验可用' : '原生入口可用'}
          </Text>
        </View>

        <View style={styles.bulletList}>
          {[
            '首页统计卡和待办摘要适合放入桌面快捷入口。',
            'Web 端可通过浏览器安装为桌面应用，保留独立窗口体验。',
            '原生 Android / iOS 小组件将继续沿用当前统计与待办信息结构。',
          ].map((line) => (
            <View key={line} style={styles.bulletRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={palette.success} />
              <Text style={[styles.bulletText, { color: palette.textSecondary }]}>{line}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semiBold,
  },
  sectionMeta: {
    fontSize: fontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  emptyPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  todoList: {
    gap: spacing.sm,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  todoIcon: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  todoCopy: {
    flex: 1,
    minWidth: 0,
  },
  todoTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  todoMeta: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  priorityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  installCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  installIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installCopy: {
    flex: 1,
  },
  installTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  installDesc: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  bulletList: {
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
