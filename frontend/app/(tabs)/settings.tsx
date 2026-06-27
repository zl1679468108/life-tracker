import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { SafeScreen } from '../../components/SafeScreen';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { useSyncStore } from '../../stores/syncStore';
import { Toast } from '../../components/Toast';
import { i18n, useTranslation } from '../../lib/i18n';

interface SettingsItemProps {
  icon: string;
  iconGradient: readonly [string, string];
  title: string;
  description?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingsItem({ icon, iconGradient, title, description, onPress, showArrow = true }: SettingsItemProps) {
  const colors = useColors();

  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={iconGradient}
        style={styles.settingsIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.white} />
      </LinearGradient>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: colors.gray[800] }]}>{title}</Text>
        {description && <Text style={[styles.settingsDesc, { color: colors.gray[400] }]}>{description}</Text>}
      </View>
      {showArrow && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const { user } = useAuthStore();
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
      toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
    }, 50);
  }, []);

  const handleSync = useCallback(async () => {
    if (status === 'syncing') return;

    try {
      await syncAll();
      showToast(t('settings.syncSuccess'), 'success');
    } catch (error) {
      showToast(t('settings.syncFailed'), 'error');
    }
  }, [status, syncAll, showToast, t]);

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return t('common.noData');
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('common.refresh');
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <SafeScreen>
      <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.gray[900] }]}>{t('settings.title')}</Text>

      <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.white }]} onPress={() => router.push('/settings/account')} activeOpacity={0.8}>
        {cachedAvatarUrl ? (
          <Image
            source={{ uri: cachedAvatarUrl }}
            style={styles.profileAvatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <LinearGradient
            colors={[...colors.primaryGradient]}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="account" size={28} color={colors.white} />
          </LinearGradient>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.gray[800] }]}>{profile?.display_name || user?.email?.split('@')[0] || t('settings.profile')}</Text>
          <Text style={[styles.profileEmail, { color: colors.gray[500] }]}>{user?.email || t('auth.login')}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>{t('settings.dataSync')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <TouchableOpacity style={styles.settingsItem} onPress={handleSync} activeOpacity={0.7} disabled={status === 'syncing'}>
            <LinearGradient
              colors={[colors.secondary, colors.secondaryLight]}
              style={styles.settingsIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {status === 'syncing' ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialCommunityIcons name="cloud-sync" size={20} color={colors.white} />
              )}
            </LinearGradient>
            <View style={styles.settingsContent}>
              <Text style={[styles.settingsTitle, { color: colors.gray[800] }]}>{t('settings.dataSync')}</Text>
              <Text style={[styles.settingsDesc, { color: colors.gray[400] }]}>
                {status === 'syncing' ? t('common.loading') : `${t('settings.lastSync')}: ${formatLastSyncTime(lastSyncTime)}`}
              </Text>
            </View>
            {status === 'syncing' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem} onPress={() => router.push('/settings/data')} activeOpacity={0.7}>
            <LinearGradient
              colors={[colors.warning, colors.warningLight]}
              style={styles.settingsIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="database" size={20} color={colors.white} />
            </LinearGradient>
            <View style={styles.settingsContent}>
              <Text style={[styles.settingsTitle, { color: colors.gray[800] }]}>数据管理</Text>
              <Text style={[styles.settingsDesc, { color: colors.gray[400] }]}>备份/恢复/导入导出</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>{t('settings.theme')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <SettingsItem
            icon="palette"
            iconGradient={[colors.danger, colors.dangerLight]}
            title={t('settings.theme')}
            description={t('settings.themeSystem')}
            onPress={() => router.push('/settings/theme')}
          />
          <SettingsItem
            icon="translate"
            iconGradient={[colors.success, colors.successLight]}
            title={t('settings.language')}
            description={i18n.getLanguage() === 'zh-CN' ? '中文' : 'English'}
            onPress={() => router.push('/settings/language')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>{t('settings.preferences')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <SettingsItem
            icon="lock"
            iconGradient={[colors.primary, colors.primaryLight]}
            title={t('settings.changePassword')}
            description={t('settings.changePasswordDesc')}
            onPress={() => router.push('/settings/change-password')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>{t('settings.about')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <SettingsItem
            icon="information"
            iconGradient={[colors.gray[400], colors.gray[500]]}
            title={t('settings.version')}
            description="v1.2.0"
            showArrow={false}
          />
          <SettingsItem
            icon="message-alert"
            iconGradient={[colors.danger, colors.dangerLight]}
            title={t('settings.feedback')}
            description={t('feedback.title')}
            onPress={() => router.push('/settings/feedback')}
          />
        </View>
      </View>
    </ScrollView>
    <Toast visible={toastVisible} message={toastMsg} type="info" />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    fontSize: fontSize['7xl'],
    fontWeight: fontWeight.bold,
    padding: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  profileAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  profileName: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semiBold,
  },
  profileEmail: {
    fontSize: fontSize.base,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  settingsDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
