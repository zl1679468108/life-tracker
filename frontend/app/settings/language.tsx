import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScreen } from '../../components/ui';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { i18n, Language, useTranslation } from '../../lib/i18n';
import { useColors, usePalette } from '../../stores/themeStore';

export default function LanguageScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = usePalette();
  const { t } = useTranslation();
  const currentLanguage = i18n.getLanguage();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'zh-CN', name: 'Chinese', nativeName: t('settings.languageZh') },
    { code: 'en', name: 'English', nativeName: t('settings.languageEn') },
  ];

  const handleLanguageChange = async (language: Language) => {
    await i18n.setLanguage(language);
    router.back();
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.section}>
        {languages.map((lang) => {
          const selected = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                {
                  backgroundColor: selected ? `${palette.orange}14` : palette.surface,
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
  section: {
    marginBottom: spacing.lg,
  },
  languageCard: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  languageMark: {
    width: 38,
    height: 38,
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
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  languageMeta: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
