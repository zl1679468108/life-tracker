import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScreen, Logo } from '../../components/ui';
import appConfig from '../../app.json';
import { CHANGELOGS, type ChangelogEntry } from '../../constants/changelog';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface ChangeGroup {
  key: 'new' | 'improved' | 'fixed';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const GROUPS: ChangeGroup[] = [
  { key: 'new', label: '新增功能', icon: 'plus-circle-outline' },
  { key: 'improved', label: '优化改进', icon: 'star-circle-outline' },
  { key: 'fixed', label: '问题修复', icon: 'wrench-outline' },
];

const GROUP_COLORS = {
  new: 'success',
  improved: 'violet',
  fixed: 'warning',
} as const;

export default function VersionScreen() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const isDark = palette.bg === appDesign.dark.bg;
  const [expanded, setExpanded] = useState<Set<string>>(new Set([CHANGELOGS[0]?.version].filter(Boolean) as string[]));

  const currentVersion = appConfig.expo.version;
  const currentDate = CHANGELOGS[0]?.date ?? '';

  const toggle = (version: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const renderGroup = (group: ChangeGroup, items: string[], palette: typeof appDesign.light) => {
    if (!items.length) return null;
    const colorKey = GROUP_COLORS[group.key];
    const color = palette[colorKey];
    return (
      <View key={group.key} style={styles.groupBlock}>
        <View style={styles.groupHeader}>
          <MaterialCommunityIcons name={group.icon} size={16} color={color} />
          <Text style={[styles.groupLabel, { color: color }]}>{group.label}</Text>
        </View>
        {items.map((item, idx) => (
          <View key={`${group.key}-${idx}`} style={styles.itemRow}>
            <Text style={[styles.itemDot, { color: palette.textMuted }]}>·</Text>
            <Text style={[styles.itemText, { color: palette.textSecondary }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEntry = (entry: ChangelogEntry, isCurrent: boolean) => {
    const isOpen = expanded.has(entry.version);
    return (
      <View
        key={entry.version}
        style={[
          styles.entryCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
          !isDark && shadows.sm,
        ]}
      >
        <TouchableOpacity
          style={styles.entryHeader}
          onPress={() => toggle(entry.version)}
          activeOpacity={0.82}
        >
          <View style={styles.entryHeaderLeft}>
            <Text style={[styles.versionText, { color: palette.text }]}>v{entry.version}</Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: palette.orange }]}>
                <Text style={[styles.currentBadgeText, { color: palette.surface }]}>当前</Text>
              </View>
            )}
            <Text style={[styles.dateText, { color: palette.textMuted }]}>{entry.date}</Text>
          </View>
          <MaterialCommunityIcons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={palette.textMuted}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.entryBody}>
            {GROUPS.map((g) => renderGroup(g, entry.changes[g.key], palette))}
          </View>
        )}
      </View>
    );
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      {/* 顶部当前版本卡片 */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
          !isDark && shadows.md,
        ]}
      >
        <Logo size={72} />
        <Text style={[styles.appName, { color: palette.text }]}>LifeTracker</Text>
        <Text style={[styles.tagline, { color: palette.textMuted }]}>
          记录物品位置 · 管理日常待办 · 让生活有条理
        </Text>
        <View style={styles.heroVersionRow}>
          <Text style={[styles.heroVersion, { color: palette.text }]}>v{currentVersion}</Text>
          <Text style={[styles.heroDot, { color: palette.textMuted }]}>·</Text>
          <Text style={[styles.heroDate, { color: palette.textMuted }]}>{currentDate}</Text>
        </View>
      </View>

      {/* 版本日志列表 */}
      {CHANGELOGS.map((entry, idx) => renderEntry(entry, idx === 0))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: fontSize['5xl'],
    lineHeight: 26,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroVersion: {
    fontSize: fontSize.lg,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  heroDot: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  heroDate: {
    fontSize: fontSize.sm,
    lineHeight: 16,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  entryHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  versionText: {
    fontSize: fontSize.lg,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.semiBold,
  },
  dateText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    marginLeft: 'auto',
  },
  entryBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  groupBlock: {
    marginTop: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  groupLabel: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: 3,
  },
  itemDot: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  itemText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
});
