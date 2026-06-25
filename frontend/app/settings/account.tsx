import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import * as ImagePickerLib from 'expo-image-picker';
import { uploadImage, compressAvatar } from '../../lib/upload';
import { useTranslation } from '../../lib/i18n';

export default function AccountScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { profile, fetchProfile, updateProfile, cachedAvatarUrl, initCachedAvatar } = useProfileStore();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const syncProfileToForm = React.useCallback(() => {
    if (!profile) return;
    setUsername(profile.display_name || user?.email?.split('@')[0] || t('settings.profile'));
    setEmail(profile.email || user?.email || '');
    setAvatar(profile.avatar_url || null);
  }, [profile, user?.email]);

  // 初始化数据
  React.useEffect(() => {
    initCachedAvatar();
    fetchProfile();
  }, []);

  React.useEffect(() => {
    if (!editing) syncProfileToForm();
  }, [editing, syncProfileToForm]);

  // 使用缓存的头像 URL 作为初始值，避免等待 API
  React.useEffect(() => {
    if (cachedAvatarUrl && !avatar) {
      setAvatar(cachedAvatarUrl);
    }
  }, [cachedAvatarUrl]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const handleCancelEdit = () => {
    syncProfileToForm();
    setEditing(false);
  };

  const pickAvatar = async () => {
    const result = await ImagePickerLib.launchImageLibraryAsync({
      mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      // 先压缩头像再设置
      const compressedUri = await compressAvatar(result.assets[0].uri);
      setAvatar(compressedUri);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      showToast('请输入用户名', 'error');
      return;
    }
    if (!email.trim()) {
      showToast(t('settings.email'), 'error');
      return;
    }
    
    setSaving(true);
    try {
      let avatarUrl = avatar;
      
      // 如果头像是本地文件，先上传
      if (avatar && !avatar.startsWith('http')) {
        avatarUrl = await uploadImage(avatar, user!.id);
      }
      
      await updateProfile({
        display_name: username.trim(),
        email: email.trim(),
        avatar_url: avatarUrl || undefined,
      });
      
      showToast(t('settings.syncSuccess'), 'success');
      setEditing(false);
    } catch (error) {
      showToast(t('common.requestFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('auth.logoutConfirm'));
      if (!confirmed) return;
      try {
        await signOut();
        router.replace('/auth/login');
      } catch (error) {
        showToast(t('common.requestFailed'), 'error');
      }
      return;
    }

    showAlert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/login');
          } catch (error) {
            showAlert(t('common.error'), t('common.requestFailed'));
          }
        }},
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={editing ? pickAvatar : undefined} activeOpacity={0.8} disabled={!editing}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <LinearGradient
                colors={[...colors.primaryGradient]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="account" size={48} color={colors.white} />
              </LinearGradient>
            )}
            {editing && (
              <View style={styles.avatarEditBadge}>
                <MaterialCommunityIcons name="camera" size={14} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.gray[900] }]}>{username}</Text>
          <Text style={[styles.userEmail, { color: colors.gray[500] }]}>{email || t('auth.login')}</Text>
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
            <View style={styles.menuItem}>
              <LinearGradient
                colors={[colors.secondary, colors.secondaryLight]}
                style={styles.menuIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="account-edit" size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.gray[800] }]}>{t('settings.username')}</Text>
                {editing ? (
                  <TextInput
                    style={[styles.menuInput, { color: colors.gray[800], borderBottomColor: colors.primary }]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t('settings.username')}
                    placeholderTextColor={colors.gray[400]}
                  />
                ) : (
                  <Text style={[styles.menuValue, { color: colors.gray[500] }]}>{username}</Text>
                )}
              </View>
            </View>

            <View style={styles.menuItem}>
              <LinearGradient
                colors={[colors.success, colors.successLight]}
                style={styles.menuIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="email" size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.gray[800] }]}>{t('settings.email')}</Text>
                {editing ? (
                  <TextInput
                    style={[styles.menuInput, { color: colors.gray[800], borderBottomColor: colors.primary }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('settings.email')}
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={[styles.menuValue, { color: colors.gray[500] }]}>{email}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {editing ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.gray[100] }]} onPress={handleCancelEdit} activeOpacity={0.7}>
              <Text style={[styles.cancelBtnText, { color: colors.gray[700] }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.7}>
              <Text style={[styles.saveBtnText, { color: colors.white }]}>{saving ? t('common.loading') : t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <TouchableOpacity style={[styles.editCard, { backgroundColor: colors.white }]} onPress={() => setEditing(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              <Text style={[styles.editCardText, { color: colors.primary }]}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>{t('settings.account')}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/change-password')} activeOpacity={0.7}>
              <LinearGradient
                colors={[colors.secondary, colors.secondaryLight]}
                style={styles.menuIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="lock" size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.gray[800] }]}>{t('settings.changePassword')}</Text>
                <Text style={[styles.menuDesc, { color: colors.gray[400] }]}>{t('settings.changePassword')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
              <LinearGradient
                colors={[colors.danger, colors.dangerLight]}
                style={styles.menuIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="logout" size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.gray[800] }]}>{t('auth.logout')}</Text>
                <Text style={[styles.menuDesc, { color: colors.gray[400] }]}>{t('auth.logout')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.lg,
  },
  userEmail: {
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  menuValue: {
    fontSize: fontSize.base,
    marginTop: 2,
  },
  menuInput: {
    fontSize: fontSize.base,
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginTop: 2,
  },
  menuDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  editCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  editCardText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  cancelBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  saveBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
});
