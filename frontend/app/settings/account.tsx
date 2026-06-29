import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePickerLib from 'expo-image-picker';
import { Toast } from '../../components/Toast';
import { AppListRow, FormActions } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { showAlert } from '../../lib/alert';
import { useTranslation } from '../../lib/i18n';
import { compressAvatar, uploadImage } from '../../lib/upload';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { useColors } from '../../stores/themeStore';

type Palette = typeof appDesign.dark;

function InfoField({
  label,
  value,
  onChangeText,
  placeholder,
  editable,
  palette,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable: boolean;
  palette: Palette;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={[styles.fieldCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textDisabled}
          style={[styles.fieldInput, { color: palette.text }]}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: palette.text }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      )}
    </View>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const syncProfileToForm = useCallback(() => {
    if (!profile && !user) return;
    setUsername(profile?.display_name || user?.email?.split('@')[0] || t('settings.profile'));
    setEmail(profile?.email || user?.email || '');
    setAvatar(profile?.avatar_url || cachedAvatarUrl || null);
  }, [cachedAvatarUrl, profile, t, user]);

  useEffect(() => {
    initCachedAvatar();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!editing) {
      syncProfileToForm();
    }
  }, [editing, syncProfileToForm]);

  useEffect(() => {
    if (cachedAvatarUrl && !avatar) {
      setAvatar(cachedAvatarUrl);
    }
  }, [avatar, cachedAvatarUrl]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    clearTimeout(toastTimer.current);
    setToastVisible(false);
    setTimeout(() => {
      setToastMsg(msg);
      setToastType(type);
      setToastVisible(true);
      toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
    }, 40);
  }, []);

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
      if (avatar && !avatar.startsWith('http')) {
        avatarUrl = await uploadImage(avatar, user!.id);
      }
      await updateProfile({
        display_name: username.trim(),
        email: email.trim(),
        avatar_url: avatarUrl || undefined,
      });
      showToast('资料已更新', 'success');
      setEditing(false);
    } catch {
      showToast(t('common.requestFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    showAlert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/login');
          } catch {
            showAlert(t('common.error'), t('common.requestFailed'));
          }
        },
      },
    ]);
  };

  const profileName = username || t('settings.profile');
  const profileEmail = email || t('auth.login');
  const userCode = useMemo(() => (user?.id ? `ID ${user.id.slice(0, 6)}` : 'ID ----'), [user?.id]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroBlock}>
          <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>账号资料</Text>
          <View style={styles.heroRow}>
            <TouchableOpacity
              style={[styles.avatarWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={editing ? pickAvatar : undefined}
              activeOpacity={0.82}
              disabled={!editing}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" transition={150} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <Text style={[styles.avatarLetter, { color: palette.orange }]}>
                    {(profileName || '我').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              {editing ? (
                <View style={[styles.avatarBadge, { backgroundColor: palette.orange, borderColor: palette.bg }]}>
                  <MaterialCommunityIcons name="camera-outline" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </TouchableOpacity>

            <View style={styles.heroCopy}>
              <Text style={[styles.heroName, { color: palette.text }]} numberOfLines={1}>
                {profileName}
              </Text>
              <Text style={[styles.heroEmail, { color: palette.textMuted }]} numberOfLines={1}>
                {profileEmail}
              </Text>
              <View style={[styles.heroBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <Text style={[styles.heroBadgeText, { color: palette.orange }]}>{userCode}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>基础资料</Text>
          <InfoField
            label={t('settings.username')}
            value={username}
            onChangeText={setUsername}
            placeholder={t('settings.username')}
            editable={editing}
            palette={palette}
          />
          <InfoField
            label={t('settings.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('settings.email')}
            editable={editing}
            palette={palette}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>账号操作</Text>
          <AppListRow
            title={t('settings.changePassword')}
            description="更新登录密码和安全凭据"
            icon="lock-outline"
            accent={palette.violet}
            onPress={() => router.push('/settings/change-password')}
          />
          <AppListRow
            title={t('auth.logout')}
            description="退出当前账号并返回登录页"
            icon="logout"
            accent={palette.danger}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
        {editing ? (
          <FormActions
            onCancel={handleCancelEdit}
            onSubmit={handleSave}
            submitLabel={saving ? t('common.loading') : t('common.save')}
            cancelLabel={t('common.cancel')}
            loading={false}
            disabled={saving}
            style={styles.formActions}
          />
        ) : (
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: palette.orange }]}
            onPress={() => setEditing(true)}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>{t('common.edit')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 132,
  },
  heroBlock: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: fontWeight.bold,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontSize: fontSize['3xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  heroEmail: {
    fontSize: fontSize.base,
    lineHeight: 20,
    marginTop: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  fieldCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  fieldInput: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
    paddingVertical: 0,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
  formActions: {
    marginTop: 0,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
});
