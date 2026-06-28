import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../components/SafeScreen';
import { Toast } from '../../components/Toast';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { showAlert } from '../../lib/alert';
import { i18n, useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';
import { useProfileStore } from '../../stores/profileStore';
import { useSyncStore } from '../../stores/syncStore';

type Palette = typeof appDesign.dark;

type MineEntry = {
  title: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route?: string;
  tone?: keyof Pick<Palette, 'orange' | 'violet' | 'success' | 'warning' | 'danger'>;
  onPress?: () => void;
  loading?: boolean;
  readonly?: boolean;
};

function IconMark({ icon, color, palette }: { icon: MineEntry['icon']; color: string; palette: Palette }) {
  return (
    <View style={[styles.entryIcon, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
  );
}

function MineRow({ entry, palette, onPress }: { entry: MineEntry; palette: Palette; onPress: () => void }) {
  const tone = entry.tone ? palette[entry.tone] : palette.textMuted;
  return (
    <TouchableOpacity
      style={[styles.entryRow, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={entry.readonly ? 1 : 0.82}
      disabled={entry.readonly || entry.loading}
    >
      <IconMark icon={entry.icon} color={tone} palette={palette} />
      <View style={styles.entryText}>
        <Text style={[styles.entryTitle, { color: palette.text }]}>{entry.title}</Text>
        <Text style={[styles.entryDesc, { color: palette.textMuted }]} numberOfLines={1}>
          {entry.desc}
        </Text>
      </View>
      {entry.loading ? (
        <ActivityIndicator size="small" color={palette.orange} />
      ) : entry.readonly ? (
        <Text style={[styles.readonlyText, { color: palette.textMuted }]}>v1.2.0</Text>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { profile, fetchProfile, cachedAvatarUrl, initCachedAvatar } = useProfileStore();
  const { status, lastSyncTime, syncAll } = useSyncStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    initCachedAvatar();
    fetchProfile();
  }, []);

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

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return t('common.noData');
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return t('common.refresh');
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const handleSync = useCallback(async () => {
    if (status === 'syncing') return;
    try {
      await syncAll();
      showToast(t('settings.syncSuccess'), 'success');
    } catch {
      showToast(t('settings.syncFailed'), 'error');
    }
  }, [status, syncAll, showToast, t]);

  const handleSignOut = () => {
    showAlert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const go = (route: string) => router.push(route as never);

  const sections: Array<{ title: string; entries: MineEntry[] }> = [
    {
      title: '账号与安全',
      entries: [
        { title: '账号管理', desc: user?.email || '管理头像、昵称和账号资料', icon: 'account-circle-outline', route: '/settings/account', tone: 'orange' },
        { title: '修改密码', desc: '更新登录密码和安全凭据', icon: 'lock-outline', route: '/settings/change-password', tone: 'violet' },
        { title: '退出登录', desc: '退出当前账号并返回登录页', icon: 'logout', onPress: handleSignOut, tone: 'danger' },
      ],
    },
    {
      title: '偏好设置',
      entries: [
        { title: '主题设置', desc: '深色、浅色或跟随系统', icon: 'theme-light-dark', route: '/settings/theme', tone: 'violet' },
        { title: '语言', desc: i18n.getLanguage() === 'zh-CN' ? '中文' : 'English', icon: 'translate', route: '/settings/language', tone: 'success' },
      ],
    },
    {
      title: '数据与支持',
      entries: [
        {
          title: '数据同步',
          desc: status === 'syncing' ? t('common.loading') : `${t('settings.lastSync')}: ${formatLastSyncTime(lastSyncTime)}`,
          icon: 'cloud-sync-outline',
          onPress: handleSync,
          loading: status === 'syncing',
          tone: 'orange',
        },
        { title: '数据管理', desc: '备份、恢复、导入、导出', icon: 'database-outline', route: '/settings/data', tone: 'violet' },
        { title: '反馈建议', desc: '提交问题或产品建议', icon: 'message-alert-outline', route: '/settings/feedback', tone: 'warning' },
        { title: '版本信息', desc: '当前应用版本', icon: 'information-outline', readonly: true },
      ],
    },
  ];

  return (
    <SafeScreen backgroundColor={palette.bg}>
      <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>我的</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
          onPress={() => go('/settings/account')}
          activeOpacity={0.82}
        >
          {cachedAvatarUrl ? (
            <Image source={{ uri: cachedAvatarUrl }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.avatarText, { color: palette.orange }]}>
                {(profile?.display_name || user?.email || '我').slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: palette.text }]} numberOfLines={1}>
              {profile?.display_name || user?.email?.split('@')[0] || t('settings.profile')}
            </Text>
            <Text style={[styles.profileEmail, { color: palette.textMuted }]} numberOfLines={1}>
              {user?.email || t('auth.login')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
        </TouchableOpacity>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{section.title}</Text>
            {section.entries.map((entry) => (
              <MineRow
                key={entry.title}
                entry={entry}
                palette={palette}
                onPress={() => (entry.onPress ? entry.onPress() : entry.route ? go(entry.route) : undefined)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <Toast visible={toastVisible} message={toastMsg} type={toastType} />
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
  profileCard: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: fontSize['3xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  profileEmail: {
    fontSize: fontSize.base,
    lineHeight: 20,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  entryRow: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: {
    flex: 1,
    minWidth: 0,
  },
  entryTitle: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  entryDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
  readonlyText: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
});
