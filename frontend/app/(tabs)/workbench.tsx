import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlobalSearch } from '../../components/GlobalSearch';
import { AppHeader, WorkbenchBackground } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

type Entry = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  color: string;
};

type Group = {
  title: string;
  entries: Entry[];
};

export default function WorkbenchScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [searchVisible, setSearchVisible] = useState(false);

  const core: Entry[] = [
    { title: '物品', icon: 'package-variant', route: '/item/list', color: palette.orange },
    { title: '待办', icon: 'check-circle-outline', route: '/todo/list', color: palette.violet },
  ];

  const groups: Group[] = [
    {
      title: '管理工具',
      entries: [
        { title: '分类', icon: 'tag-multiple-outline', route: '/settings/category-manage', color: palette.orange },
        { title: '位置', icon: 'map-marker-outline', route: '/settings/location-manage', color: palette.violet },
        { title: '模板', icon: 'file-document-outline', route: '/settings/templates', color: palette.warning },
      ],
    },
    {
      title: '生活记录',
      entries: [
        { title: '借用', icon: 'account-arrow-right-outline', route: '/settings/borrowings', color: palette.success },
        { title: '日历', icon: 'calendar-month-outline', route: '/settings/calendar', color: palette.violet },
      ],
    },
    {
      title: '数据与提醒',
      entries: [
        { title: '统计', icon: 'chart-bar', route: '/settings/stats', color: palette.orange },
        { title: '通知', icon: 'bell-outline', route: '/settings/notifications', color: palette.warning },
        { title: '数据', icon: 'database-outline', route: '/settings/data', color: palette.violet },
        { title: '资产', icon: 'wallet-outline', route: '/settings/assets', color: palette.success },
        { title: '快捷', icon: 'cellphone-link', route: '/settings/widgets', color: palette.danger },
      ],
    },
  ];

  const go = (route: string) => router.push(route as never);

  return (
    <SafeScreen backgroundColor={palette.bg}>
      <View style={styles.pageWrap}>
        {/* 氛围背景层 */}
        <View style={styles.atmosphereArea} pointerEvents="none">
          <LinearGradient
            colors={palette.bg === appDesign.dark.bg
              ? ['rgba(124,92,252,0.08)', 'rgba(243,111,60,0.03)', palette.bg]
              : ['#F0EDFF', '#FFF6F0', palette.bg]
            }
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <WorkbenchBackground />
        </View>

        <View style={[styles.stickyHeader, { backgroundColor: 'transparent' }]}>
          <AppHeader title="工作台" actions={[{ icon: 'magnify', label: '搜索', onPress: () => setSearchVisible(true) }]} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.coreGrid}>
            {core.map((entry) => (
              <TouchableOpacity
                key={entry.title}
                style={[styles.coreCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => go(entry.route)}
                activeOpacity={0.82}
              >
                <View style={[styles.coreIcon, { backgroundColor: `${entry.color}16`, borderColor: `${entry.color}2E` }]}>
                  <MaterialCommunityIcons name={entry.icon} size={22} color={entry.color} />
                </View>
                <Text style={[styles.coreTitle, { color: palette.text }]}>{entry.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {groups.map((group) => (
            <View key={group.title} style={[styles.groupCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: palette.text }]}>{group.title}</Text>
                <View style={[styles.groupBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <Text style={[styles.groupBadgeText, { color: palette.textMuted }]}>{group.entries.length}</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {group.entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.title}
                    style={styles.gridItem}
                    onPress={() => go(entry.route)}
                    activeOpacity={0.78}
                  >
                    <View style={[styles.gridIconWrap, { backgroundColor: `${entry.color}12` }]}>
                      <MaterialCommunityIcons name={entry.icon} size={20} color={entry.color} />
                    </View>
                    <Text style={[styles.gridLabel, { color: palette.text }]} numberOfLines={1}>{entry.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
        </ScrollView>
      </View>
    </SafeScreen>
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
    height: 300,
  },
  stickyHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 112,
  },
  coreGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  coreCard: {
    flex: 1,
    minHeight: 88,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coreIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  groupBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  groupBadgeText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    minHeight: 72,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});
