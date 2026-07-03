import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import appConfig from '../../app.json';
import { Toast } from '../../components/Toast';
import { AppHeader, SettingsBackground } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { showAlert } from '../../lib/alert';
import { i18n, useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';
import { useProfileStore } from '../../stores/profileStore';
import { useSyncStore } from '../../stores/syncStore';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile, fetchProfile, cachedAvatarUrl, avatarDataUri, initCachedAvatar } = useProfileStore();
  const { status, lastSyncTime, syncAll } = useSyncStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const profileName = profile?.display_name || user?.email?.split('@')[0] || t('settings.profile');
  const profileEmail = user?.email || t('auth.login');
  const appVersion = appConfig.expo.version;
  const avatarSource = avatarDataUri || cachedAvatarUrl || undefined;

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

  const go = (route: string) => router.push(route as never);

  const sections = [
    {
      title: '偏好设置',
      entries: [
        { title: '主题', icon: 'theme-light-dark', route: '/settings/theme', color: palette.violet },
        { title: '语言', icon: 'translate', route: '/settings/language', color: palette.success },
      ],
    },
    {
      title: '数据与支持',
      entries: [
        { title: '同步', icon: 'cloud-sync-outline', onPress: handleSync, color: palette.orange, loading: status === 'syncing' },
        { title: '数据', icon: 'database-outline', route: '/settings/data', color: palette.violet },
        { title: '反馈', icon: 'message-alert-outline', route: '/settings/feedback', color: palette.warning },
        { title: '版本', icon: 'information-outline', color: palette.textMuted, meta: `v${appVersion}` },
      ],
    },
  ];

  return (
    <SafeScreen backgroundColor={palette.bg}>
      <View style={styles.pageWrap}>
        {/* 氛围背景层 */}
        <View style={styles.atmosphereArea} pointerEvents="none">
          <LinearGradient
            colors={palette.bg === appDesign.dark.bg
              ? ['rgba(243,111,60,0.1)', 'rgba(124,92,252,0.04)', palette.bg]
              : ['#FFF0E9', '#F0EDFF', palette.bg]
            }
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SettingsBackground />
        </View>

        <View style={[styles.stickyHeader, { backgroundColor: 'transparent' }]}>
          <AppHeader title="我的" />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={[styles.profileCard, { backgroundColor: palette.surface, borderColor: palette.border, ...shadows.md }]}
            onPress={() => go('/settings/account')}
            activeOpacity={0.82}
          >
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" transition={150} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <Text style={[styles.avatarText, { color: palette.orange }]}>
                  {(profile?.display_name || user?.email || '我').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: palette.text }]} numberOfLines={1}>
                {profileName}
              </Text>
              <Text style={[styles.profileEmail, { color: palette.textMuted }]} numberOfLines={1}>
                {profileEmail}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
          </TouchableOpacity>

          {sections.map((section) => (
            <View key={section.title} style={[styles.groupCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: palette.text }]}>{section.title}</Text>
                <View style={[styles.groupBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <Text style={[styles.groupBadgeText, { color: palette.textMuted }]}>{section.entries.length}</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {section.entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.title}
                    style={styles.gridItem}
                    onPress={entry.onPress ? entry.onPress : entry.route ? () => go(entry.route) : undefined}
                    activeOpacity={entry.onPress || entry.route ? 0.78 : 1}
                    disabled={!entry.onPress && !entry.route}
                  >
                    <View style={[styles.gridIconWrap, { backgroundColor: `${entry.color}12` }]}>
                      {entry.loading ? (
                        <ActivityIndicator size="small" color={entry.color} />
                      ) : (
                        <MaterialCommunityIcons name={entry.icon as any} size={20} color={entry.color} />
                      )}
                    </View>
                    <Text style={[styles.gridLabel, { color: palette.text }]} numberOfLines={1}>{entry.title}</Text>
                    {entry.meta && (
                      <Text style={[styles.gridMeta, { color: palette.textMuted }]} numberOfLines={1}>{entry.meta}</Text>
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
  profileCard: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: fontWeight.bold,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: fontSize.xl,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    lineHeight: 18,
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
    minHeight: 78,
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
  gridMeta: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: 2,
  },
});
