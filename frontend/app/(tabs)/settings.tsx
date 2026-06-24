import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Modal } from 'react-native';
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
import { exportData } from '../../lib/export';
import { i18n } from '../../lib/i18n';

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
  const { user } = useAuthStore();
  const { profile, fetchProfile, cachedAvatarUrl, initCachedAvatar } = useProfileStore();
  const { status, lastSyncTime, syncAll } = useSyncStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [showExportModal, setShowExportModal] = useState(false);
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
      showToast('同步成功', 'success');
    } catch (error) {
      showToast('同步失败，请重试', 'error');
    }
  }, [status, syncAll, showToast]);

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return '从未同步';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    setShowExportModal(false);
    try {
      await exportData(format);
      showToast(`导出${format.toUpperCase()}成功`, 'success');
    } catch (error) {
      showToast('导出失败，请重试', 'error');
    }
  }, [showToast]);

  return (
    <SafeScreen>
      <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.gray[900] }]}>设置</Text>

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
          <Text style={[styles.profileName, { color: colors.gray[800] }]}>{profile?.display_name || user?.email?.split('@')[0] || '用户'}</Text>
          <Text style={[styles.profileEmail, { color: colors.gray[500] }]}>{user?.email || '未登录'}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>数据管理</Text>
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
              <Text style={[styles.settingsTitle, { color: colors.gray[800] }]}>数据同步</Text>
              <Text style={[styles.settingsDesc, { color: colors.gray[400] }]}>
                {status === 'syncing' ? '同步中...' : `上次同步：${formatLastSyncTime(lastSyncTime)}`}
              </Text>
            </View>
            {status === 'syncing' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowExportModal(true)} activeOpacity={0.7}>
            <LinearGradient
              colors={[colors.success, colors.successLight]}
              style={styles.settingsIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="download" size={20} color={colors.white} />
            </LinearGradient>
            <View style={styles.settingsContent}>
              <Text style={[styles.settingsTitle, { color: colors.gray[800] }]}>导出数据</Text>
              <Text style={[styles.settingsDesc, { color: colors.gray[400] }]}>导出所有数据为 JSON 或 CSV 格式</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>外观</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <SettingsItem
            icon="palette"
            iconGradient={[colors.danger, colors.dangerLight]}
            title="主题设置"
            description="切换浅色/深色模式"
            onPress={() => router.push('/settings/theme')}
          />
          <SettingsItem
            icon="translate"
            iconGradient={[colors.success, colors.successLight]}
            title="语言设置"
            description={i18n.getLanguage() === 'zh-CN' ? '中文' : 'English'}
            onPress={() => router.push('/settings/language')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>分类管理</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <SettingsItem
            icon="tag"
            iconGradient={[...colors.primaryGradient]}
            title="分类管理"
            description="物品分类、待办分类"
            onPress={() => router.push('/settings/category-manage')}
          />
          <SettingsItem
            icon="map-marker"
            iconGradient={[colors.secondary, colors.secondaryLight]}
            title="位置管理"
            description="管理物品存放位置"
            onPress={() => router.push('/settings/location-manage')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>关于</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          <SettingsItem
            icon="information"
            iconGradient={[colors.gray[400], colors.gray[500]]}
            title="版本"
            description="v1.0.0"
            showArrow={false}
          />
          <SettingsItem
            icon="message-alert"
            iconGradient={[colors.danger, colors.dangerLight]}
            title="反馈建议"
            description="帮助我们改进产品"
            onPress={() => router.push('/settings/feedback')}
          />
        </View>
      </View>
    </ScrollView>
    <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
      <TouchableOpacity style={styles.exportModalOverlay} activeOpacity={1} onPress={() => setShowExportModal(false)}>
        <View style={[styles.exportModalContent, { backgroundColor: colors.white }]}>
          <Text style={[styles.exportModalTitle, { color: colors.gray[800] }]}>选择导出格式</Text>
          <TouchableOpacity style={[styles.exportModalOption, { backgroundColor: colors.gray[50] }]} onPress={() => handleExport('json')} activeOpacity={0.7}>
            <View style={[styles.exportModalIcon, { backgroundColor: colors.success }]}>
              <MaterialCommunityIcons name="file-json" size={22} color={colors.white} />
            </View>
            <View style={styles.exportModalOptionText}>
              <Text style={[styles.exportModalOptionTitle, { color: colors.gray[800] }]}>JSON</Text>
              <Text style={[styles.exportModalOptionDesc, { color: colors.gray[500] }]}>结构化数据，适合备份和迁移</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportModalOption, { backgroundColor: colors.gray[50] }]} onPress={() => handleExport('csv')} activeOpacity={0.7}>
            <View style={[styles.exportModalIcon, { backgroundColor: '#8B5CF6' }]}>
              <MaterialCommunityIcons name="file-delimited" size={22} color={colors.white} />
            </View>
            <View style={styles.exportModalOptionText}>
              <Text style={[styles.exportModalOptionTitle, { color: colors.gray[800] }]}>CSV</Text>
              <Text style={[styles.exportModalOptionDesc, { color: colors.gray[500] }]}>表格格式，适合 Excel 打开</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
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
  exportModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  exportModalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: 40,
  },
  exportModalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.lg,
  },
  exportModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  exportModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exportModalOptionText: {
    flex: 1,
  },
  exportModalOptionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  exportModalOptionDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
