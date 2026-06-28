import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { api } from '../../lib/api';
import { showAlert } from '../../lib/alert';
import type { WidgetStatsData, WidgetTodoData } from '../../types';

export default function WidgetsScreen() {
  const colors = useColors();
  const [stats, setStats] = useState<WidgetStatsData | null>(null);
  const [todos, setTodos] = useState<WidgetTodoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [statsRes, todosRes] = await Promise.all([
      api.widgets.stats(),
      api.widgets.todos(5),
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (todosRes.data?.todos) setTodos(todosRes.data.todos);
    setLoading(false);
  };

  const handleInstallPWA = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.deferredPrompt) {
        // @ts-ignore
        window.deferredPrompt.prompt();
      } else {
        showAlert('安装提示', '请在浏览器菜单中选择"安装应用"');
      }
    } else {
      showAlert('安装提示', '当前平台可通过系统桌面小组件或快捷方式访问 LifeTracker。');
    }
  };

  const priorityColors: Record<number, string> = { 1: colors.success, 2: colors.warning, 3: colors.danger };
  const priorityLabels: Record<number, string> = { 1: '低', 2: '中', 3: '高' };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      {/* 统计卡片 */}
      <View style={[styles.statsCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.gray[900] }]}>快速统计</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.gray[900] }]}>{stats?.items_count || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>物品</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.successLight }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.gray[900] }]}>{stats?.todos_completed || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>已完成</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.warningLight }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.gray[900] }]}>{stats?.todos_pending || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>待完成</Text>
          </View>
        </View>
      </View>

      {/* 待办列表预览 */}
      <View style={[styles.todoCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.gray[900] }]}>待办事项 TOP 5</Text>
        {todos.map(todo => (
          <View key={todo.id} style={[styles.todoItem, { borderBottomColor: colors.gray[100] }]}>
            <View style={[styles.todoCheckbox, { borderColor: todo.completed ? colors.success : colors.gray[300] }]}>
              {todo.completed && <MaterialCommunityIcons name="check" size={14} color={colors.success} />}
            </View>
            <View style={styles.todoContent}>
              <Text style={[
                styles.todoText,
                { color: todo.completed ? colors.gray[400] : colors.gray[800] },
                todo.completed && { textDecorationLine: 'line-through' },
              ]}>
                {todo.title}
              </Text>
              {todo.due_date && (
                <Text style={[styles.todoDue, { color: colors.gray[400] }]}>
                  {new Date(todo.due_date).toLocaleDateString('zh-CN')}
                </Text>
              )}
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors[todo.priority] + '20' }]}>
              <Text style={[styles.priorityText, { color: priorityColors[todo.priority] }]}>
                {priorityLabels[todo.priority]}
              </Text>
            </View>
          </View>
        ))}
        {todos.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.gray[400] }]}>暂无待办</Text>
        )}
      </View>

      {/* PWA 安装提示 */}
      {Platform.OS === 'web' && (
        <TouchableOpacity style={[styles.pwaCard, { backgroundColor: colors.secondaryLight }]} onPress={handleInstallPWA}>
          <MaterialCommunityIcons name="cellphone-arrow-down" size={24} color={colors.secondary} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[styles.pwaTitle, { color: colors.gray[800] }]}>安装到桌面</Text>
            <Text style={[styles.pwaDesc, { color: colors.gray[500] }]}>将 LifeTracker 安装为桌面应用，获得更好的体验</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      )}

      {/* 小组件说明 */}
      <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.gray[900] }]}>关于桌面小组件</Text>
        </View>
        <Text style={[styles.infoText, { color: colors.gray[500] }]}>
          桌面小组件需要原生开发支持。当前通过 PWA 方式提供类似体验：
        </Text>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="check" size={14} color={colors.success} />
          <Text style={[styles.infoItemText, { color: colors.gray[600] }]}>Web PWA 安装到主屏幕</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="check" size={14} color={colors.success} />
          <Text style={[styles.infoItemText, { color: colors.gray[600] }]}>快速访问待办和统计</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="check" size={14} color={colors.success} />
          <Text style={[styles.infoItemText, { color: colors.gray[600] }]}>离线数据缓存</Text>
        </View>
        <Text style={[styles.infoNote, { color: colors.gray[400] }]}>
          原生 Android/iOS 小组件将在后续版本中支持
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  statsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  statLabel: { fontSize: fontSize.xs },
  todoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoContent: { flex: 1 },
  todoText: { fontSize: fontSize.base },
  todoDue: { fontSize: fontSize.xs, marginTop: 2 },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  pwaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  pwaTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  pwaDesc: { fontSize: fontSize.sm, marginTop: 2 },
  infoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  infoTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold },
  infoText: { fontSize: fontSize.sm, marginBottom: spacing.md, lineHeight: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  infoItemText: { fontSize: fontSize.sm },
  infoNote: { fontSize: fontSize.xs, marginTop: spacing.md, fontStyle: 'italic' },
  emptyText: { fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.xl },
});
