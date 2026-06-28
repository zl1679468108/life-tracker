import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../components/SafeScreen';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

type Entry = {
  title: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  color: string;
};

export default function WorkbenchScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const core: Entry[] = [
    { title: '物品', desc: '列表 / 新增 / 编辑', icon: 'package-variant', route: '/item/list', color: palette.orange },
    { title: '待办', desc: '筛选 / 完成 / 编辑', icon: 'check-circle-outline', route: '/todo/list', color: palette.violet },
    { title: '消息', desc: '对话与共享协作', icon: 'message-text-outline', route: '/messages', color: palette.success },
  ];

  const groups: Array<{ title: string; entries: Entry[] }> = [
    {
      title: '管理工具',
      entries: [
        { title: '分类管理', desc: '系统分类、自定义分类、颜色图标', icon: 'tag-multiple-outline', route: '/settings/category-manage', color: palette.orange },
        { title: '位置管理', desc: '房间、层级、存放位置', icon: 'map-marker-outline', route: '/settings/location-manage', color: palette.violet },
        { title: '模板管理', desc: '常用物品和待办模板', icon: 'file-document-outline', route: '/settings/templates', color: palette.warning },
      ],
    },
    {
      title: '生活记录',
      entries: [
        { title: '借用管理', desc: '借出、归还、逾期记录', icon: 'account-arrow-right-outline', route: '/settings/borrowings', color: palette.success },
        { title: '日历视图', desc: '待办和提醒日历', icon: 'calendar-month-outline', route: '/settings/calendar', color: palette.violet },
      ],
    },
    {
      title: '数据与提醒',
      entries: [
        { title: '数据统计', desc: '图表概览和趋势', icon: 'chart-bar', route: '/settings/stats', color: palette.orange },
        { title: '通知中心', desc: '全部、未读、已读通知', icon: 'bell-outline', route: '/settings/notifications', color: palette.warning },
        { title: '数据管理', desc: '备份、恢复、导入、导出', icon: 'database-outline', route: '/settings/data', color: palette.violet },
        { title: '资产总览', desc: '资产总值和分类分布', icon: 'wallet-outline', route: '/settings/assets', color: palette.success },
        { title: '桌面小组件', desc: 'PWA 小组件和快捷入口', icon: 'widgets-outline', route: '/settings/widgets', color: palette.danger },
      ],
    },
  ];

  const go = (route: string) => router.push(route as never);

  return (
    <SafeScreen backgroundColor={palette.bg}>
      <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>工作台</Text>
        </View>

        <View style={[styles.search, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={palette.textMuted} />
          <Text style={[styles.searchText, { color: palette.textMuted }]}>搜索功能</Text>
        </View>

        <View style={styles.coreGrid}>
          {core.map((entry) => (
            <TouchableOpacity
              key={entry.title}
              style={[styles.coreCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => go(entry.route)}
              activeOpacity={0.82}
            >
              <View style={[styles.coreIcon, { backgroundColor: entry.color }]}>
                <MaterialCommunityIcons name={entry.icon} size={23} color="#FFFFFF" />
              </View>
              <Text style={[styles.coreTitle, { color: palette.text }]}>{entry.title}</Text>
              <Text style={[styles.coreDesc, { color: palette.textMuted }]}>{entry.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={[styles.groupTitle, { color: palette.text }]}>{group.title}</Text>
            {group.entries.map((entry) => (
              <TouchableOpacity
                key={entry.title}
                style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => go(entry.route)}
                activeOpacity={0.82}
              >
                <View style={[styles.rowIcon, { backgroundColor: entry.color }]}>
                  <MaterialCommunityIcons name={entry.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: palette.text }]}>{entry.title}</Text>
                  <Text style={[styles.rowDesc, { color: palette.textMuted }]} numberOfLines={1}>
                    {entry.desc}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeScreen>
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  search: {
    height: 44,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchText: {
    fontSize: fontSize.base,
  },
  coreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  coreCard: {
    width: '48.6%',
    minHeight: 132,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  coreIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreTitle: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  coreDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupTitle: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  row: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  rowDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
});
