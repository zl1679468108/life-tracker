import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlobalSearch } from '../../components/GlobalSearch';
import { AppHeader, AppListRow, AppScreen } from '../../components/ui';
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
  const [searchVisible, setSearchVisible] = useState(false);

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
    <AppScreen>
      <AppHeader title="工作台" actions={[{ icon: 'magnify', label: '搜索', onPress: () => setSearchVisible(true) }]} />

      <View style={styles.heroBlock}>
        <Text style={[styles.heroEyebrow, { color: palette.textSecondary }]}>管理与操作</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: palette.text }]}>全量入口</Text>
            <Text style={[styles.heroDesc, { color: palette.textMuted }]}>高频操作优先，低频管理按分组收口。</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.heroBadgeValue, { color: palette.text }]}>{core.length + groups.reduce((sum, group) => sum + group.entries.length, 0)}</Text>
            <Text style={[styles.heroBadgeLabel, { color: palette.textMuted }]}>功能入口</Text>
          </View>
        </View>
      </View>

      <View style={styles.coreGrid}>
        {core.map((entry, index) => (
          <TouchableOpacity
            key={entry.title}
            style={[
              styles.coreCard,
              index === core.length - 1 && core.length % 2 === 1 && styles.coreCardWide,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => go(entry.route)}
            activeOpacity={0.82}
          >
            <View style={styles.coreCardTop}>
              <View style={[styles.coreIcon, { backgroundColor: `${entry.color}16`, borderColor: `${entry.color}2E` }]}>
                <MaterialCommunityIcons name={entry.icon} size={20} color={entry.color} />
              </View>
              <MaterialCommunityIcons name="arrow-top-right" size={18} color={palette.textMuted} />
            </View>
            <View style={styles.coreText}>
              <Text style={[styles.coreTitle, { color: palette.text }]}>{entry.title}</Text>
              <Text style={[styles.coreDesc, { color: palette.textMuted }]}>{entry.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupTitle, { color: palette.text }]}>{group.title}</Text>
            <View style={[styles.groupBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.groupBadgeText, { color: palette.textMuted }]}>{group.entries.length}</Text>
            </View>
          </View>
          {group.entries.map((entry) => (
            <AppListRow
              key={entry.title}
              title={entry.title}
              description={entry.desc}
              icon={entry.icon}
              accent={entry.color}
              onPress={() => go(entry.route)}
            />
          ))}
        </View>
      ))}
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize['3xl'],
    lineHeight: 26,
    fontWeight: fontWeight.bold,
  },
  heroDesc: {
    marginTop: spacing.xs,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  heroBadge: {
    minWidth: 88,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroBadgeValue: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  heroBadgeLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  coreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  coreCard: {
    width: '48.6%',
    minHeight: 120,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  coreCardWide: {
    width: '100%',
  },
  coreCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coreIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreText: {
    marginTop: spacing.md,
    gap: 4,
  },
  coreTitle: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  coreDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: fontSize.lg,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  groupBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  groupBadgeText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
  },
});
