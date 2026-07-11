import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import appConfig from '../../app.json';
import { AppHeader, SettingsBackground } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { showAlert } from '../../lib/alert';
import { i18n, useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';
import { useProfileStore } from '../../stores/profileStore';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const isDark = palette.bg === appDesign.dark.bg;
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile, fetchProfile, cachedAvatarUrl, avatarDataUri, initCachedAvatar } = useProfileStore();
  const profileName = profile?.display_name || user?.email?.split('@')[0] || t('settings.profile');
  const profileEmail = user?.email || t('auth.login');
  const appVersion = appConfig.expo.version;
  const avatarSource = avatarDataUri || cachedAvatarUrl || undefined;

  useEffect(() => {
    initCachedAvatar();
    fetchProfile();
  }, []);

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
      title: '帮助与反馈',
      entries: [
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
              <Text style={[styles.profileEmail, { color: palette.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {profileEmail}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
          </TouchableOpacity>

          {sections.map((section) => (
            <View key={section.title} style={[styles.groupCard, { backgroundColor: palette.surface }, !isDark && shadows.sm]}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: palette.text }]}>{section.title}</Text>
                <View style={[styles.groupBadge, { backgroundColor: palette.surfaceSoft }]}>
                  <Text style={[styles.groupBadgeText, { color: palette.textMuted }]}>{section.entries.length}</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {section.entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.title}
                    style={styles.gridItem}
                    onPress={entry.route ? () => go(entry.route) : undefined}
                    activeOpacity={entry.route ? 0.78 : 1}
                    disabled={!entry.route}
                  >
                    <View style={[styles.gridIconWrap, { backgroundColor: `${entry.color}12` }]}>
                      <MaterialCommunityIcons name={entry.icon as any} size={20} color={entry.color} />
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
    paddingBottom: spacing.sm,
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
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
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
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  groupBadgeText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
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
