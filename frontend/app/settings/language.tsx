import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScreen } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { i18n, Language, useTranslation } from '../../lib/i18n';
import { useColors } from '../../stores/themeStore';

export default function LanguageScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const currentLanguage = i18n.getLanguage();

  const languages: { code: Language; name: string; nativeName: string; note: string }[] = [
    { code: 'zh-CN', name: 'Chinese', nativeName: t('settings.languageZh'), note: '默认用于中文生活管理场景' },
    { code: 'en', name: 'English', nativeName: t('settings.languageEn'), note: '适合英文界面与跨语种记录' },
  ];

  const handleLanguageChange = async (language: Language) => {
    await i18n.setLanguage(language);
    router.back();
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>{t('settings.language')}</Text>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>界面语言</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              切换后会立即应用到主要导航、设置项与表单文案。
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.badgeValue, { color: palette.text }]}>{currentLanguage === 'zh-CN' ? '中文' : 'EN'}</Text>
            <Text style={[styles.badgeLabel, { color: palette.textMuted }]}>当前语言</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        {languages.map((lang) => {
          const selected = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                {
                  backgroundColor: selected ? '#FFF4EC' : palette.surface,
                  borderColor: selected ? palette.orange : palette.border,
                },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
              activeOpacity={0.82}
            >
              <View style={[styles.languageMark, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <Text style={[styles.languageMarkText, { color: selected ? palette.orange : palette.textSecondary }]}>
                  {lang.code === 'zh-CN' ? '中' : 'EN'}
                </Text>
              </View>
              <View style={styles.languageCopy}>
                <Text style={[styles.languageName, { color: palette.text }]}>{lang.nativeName}</Text>
                <Text style={[styles.languageMeta, { color: palette.textMuted }]}>{lang.name}</Text>
                <Text style={[styles.languageNote, { color: palette.textSecondary }]}>{lang.note}</Text>
              </View>
              {selected ? (
                <View style={[styles.checkWrap, { backgroundColor: palette.orange }]}>
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                </View>
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
  },
  header: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  badge: {
    minWidth: 92,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeValue: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  badgeLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  languageCard: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  languageMark: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageMarkText: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  languageCopy: {
    flex: 1,
    minWidth: 0,
  },
  languageName: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  languageMeta: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  languageNote: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 4,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
