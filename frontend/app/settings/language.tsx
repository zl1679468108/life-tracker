import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { i18n, Language } from '../../lib/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const colors = useColors();
  const currentLanguage = i18n.getLanguage();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'zh-CN', name: 'Chinese', nativeName: '中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
  ];

  const handleLanguageChange = async (language: Language) => {
    await i18n.setLanguage(language);
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.gray[400] }]}>选择语言</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.white }]}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                { borderBottomColor: colors.gray[100] },
                currentLanguage === lang.code && { backgroundColor: colors.primaryLight }
              ]}
              onPress={() => handleLanguageChange(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: colors.gray[800] }]}>
                  {lang.nativeName}
                </Text>
                <Text style={[styles.languageEnglish, { color: colors.gray[500] }]}>
                  {lang.name}
                </Text>
              </View>
              {currentLanguage === lang.code && (
                <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  languageEnglish: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
