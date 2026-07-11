import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Toast } from '../../components/Toast';
import { AppHeader, WorkbenchBackground } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useTranslation } from '../../lib/i18n';
import { useColors } from '../../stores/themeStore';
import { useSyncStore } from '../../stores/syncStore';

type Entry = {
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route?: string;
  onPress?: () => void;
  loading?: boolean;
  color: string;
  bg: string;
};

type Group = {
  title: string;
  entries: Entry[];
};

// 每个功能入口的背景透色（浅色）
const alphaBg = (hex: string, alpha = 0.12): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function WorkbenchScreen() {
  const router = useRouter();
  const colors = useColors();
  const dark = colors.gray[50] === appDesign.dark.bg;
  const palette = dark ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const { status, syncAll } = useSyncStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    clearTimeout(toastTimer.current);
    setToastVisible(false);
    setTimeout(() => {
      setToastMsg(msg);
      setToastType(type);
      setToastVisible(true);
      toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
    }, 50);
  }, []);

  const handleSync = useCallback(async () => {
    if (status === 'syncing') return;
    try {
      await syncAll();
      showToast(t('settings.syncSuccess'), 'success');
    } catch {
      showToast(t('settings.syncFailed'), 'error');
    }
  }, [status, syncAll, showToast, t]);

  const core: Entry[] = [
    { title: '物品管理', subtitle: '追踪你的所有物品', icon: 'package-variant', route: '/item/list', color: palette.orange, bg: alphaBg('#F36F3C', dark ? 0.18 : 0.12) },
    { title: '待办管理', subtitle: '完成每日任务', icon: 'check-circle-outline', route: '/todo/list', color: palette.violet, bg: alphaBg('#7C5CFC', dark ? 0.18 : 0.12) },
  ];

  const groups: Group[] = [
    {
      title: '管理工具',
      entries: [
        { title: '分类', subtitle: '归类整理', icon: 'tag-multiple-outline', route: '/settings/category-manage', color: '#E84A5F', bg: alphaBg('#E84A5F', dark ? 0.18 : 0.12) },
        { title: '位置', subtitle: '存放地点', icon: 'map-marker-outline', route: '/settings/location-manage', color: '#D89400', bg: alphaBg('#D89400', dark ? 0.18 : 0.12) },
        { title: '模板', subtitle: '快速创建', icon: 'file-document-outline', route: '/settings/templates', color: '#8E24AA', bg: alphaBg('#8E24AA', dark ? 0.18 : 0.12) },
      ],
    },
    {
      title: '生活记录',
      entries: [
        { title: '借用', subtitle: '借出与归还', icon: 'account-arrow-right-outline', route: '/settings/borrowings', color: '#1E88E5', bg: alphaBg('#1E88E5', dark ? 0.18 : 0.12) },
        { title: '日历', subtitle: '日程概览', icon: 'calendar-month-outline', route: '/settings/calendar', color: '#43A047', bg: alphaBg('#43A047', dark ? 0.18 : 0.12) },
      ],
    },
    {
      title: '数据与提醒',
      entries: [
        { title: '同步', subtitle: '立即同步', icon: 'cloud-sync-outline', onPress: handleSync, loading: status === 'syncing', color: palette.orange, bg: alphaBg('#F36F3C', dark ? 0.18 : 0.12) },
        { title: '统计', subtitle: '完成率', icon: 'chart-bar', route: '/settings/stats', color: palette.orange, bg: alphaBg('#F36F3C', dark ? 0.18 : 0.12) },
        { title: '通知', subtitle: '提醒中心', icon: 'bell-outline', route: '/settings/notifications', color: palette.warning, bg: alphaBg('#D89400', dark ? 0.18 : 0.12) },
        { title: '数据', subtitle: '导入导出', icon: 'database-outline', route: '/settings/data', color: palette.violet, bg: alphaBg('#7C5CFC', dark ? 0.18 : 0.12) },
        { title: '资产', subtitle: '价值总览', icon: 'wallet-outline', route: '/settings/assets', color: '#10A66E', bg: alphaBg('#10A66E', dark ? 0.18 : 0.12) },
        { title: '快捷', subtitle: '桌面组件', icon: 'cellphone-link', route: '/settings/widgets', color: '#E84A5F', bg: alphaBg('#E84A5F', dark ? 0.18 : 0.12) },
      ],
    },
  ];

  const go = (route: string) => router.push(route as never);

  return (
    <SafeScreen backgroundColor={palette.bg}>
      <View style={styles.pageWrap}>
        {/* atmosphere */}
        <View style={styles.atmosphereArea} pointerEvents="none">
          <LinearGradient
            colors={dark
              ? ['rgba(124,92,252,0.08)', 'rgba(243,111,60,0.03)', palette.bg]
              : ['#F0EDFF', '#FFF6F0', palette.bg]
            }
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <WorkbenchBackground />
        </View>

        <View style={[styles.stickyHeader, { backgroundColor: 'transparent' }]}>
          <AppHeader title="功能入口" />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 核心功能 — 统一主卡片 */}
          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: palette.surface,
              },
              !dark && shadows.sm,
            ]}
          >
            <View style={styles.groupHeader}>
              <Text style={[styles.groupTitle, { color: palette.text }]}>核心功能</Text>
            </View>
            <View style={styles.coreDual}>
              {core.map((entry, index) => (
                <React.Fragment key={entry.title}>
                  {index > 0 && <View style={[styles.coreDivider, { backgroundColor: palette.border }]} />}
                  <TouchableOpacity
                    style={[
                      styles.coreHalf,
                      {
                        backgroundColor: entry.bg,
                      },
                    ]}
                    onPress={() => go(entry.route!)}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.coreIconWrap, { backgroundColor: entry.color, shadowColor: entry.color }]}>
                      <MaterialCommunityIcons name={entry.icon} size={26} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.coreTitle, { color: palette.text }]}>{entry.title}</Text>
                    <Text style={[styles.coreSubtitle, { color: palette.textMuted }]}>{entry.subtitle}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* group cards */}
          {groups.map((group) => (
            <View
              key={group.title}
              style={[
                styles.groupCard,
                {
                  backgroundColor: palette.surface,
                },
                !dark && shadows.sm,
              ]}
            >
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
                    onPress={entry.onPress ? entry.onPress : () => go(entry.route!)}
                    activeOpacity={0.7}
                    disabled={entry.loading}
                  >
                    <View style={[styles.gridIconWrap, { backgroundColor: entry.bg }]}>
                      {entry.loading ? (
                        <ActivityIndicator size="small" color={entry.color} />
                      ) : (
                        <MaterialCommunityIcons name={entry.icon} size={22} color={entry.color} />
                      )}
                    </View>
                    <Text style={[styles.gridLabel, { color: palette.text }]} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    {entry.subtitle && (
                      <Text style={[styles.gridSubLabel, { color: palette.textMuted }]} numberOfLines={1}>
                        {entry.subtitle}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <Toast visible={toastVisible} message={toastMsg} type={toastType} />
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  pageWrap: { flex: 1 },
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
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 112,
  },
  coreDual: {
    flexDirection: 'row',
  },
  coreDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  coreHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  coreIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  coreTitle: {
    fontSize: fontSize.lg,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  coreSubtitle: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.regular,
  },
  groupCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
    width: '20%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    minHeight: 88,
  },
  gridIconWrap: {
    width: 44,
    height: 44,
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
  gridSubLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: fontWeight.regular,
    textAlign: 'center',
    marginTop: 1,
  },
});
