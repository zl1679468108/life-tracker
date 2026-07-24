import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';
import { Toast } from '../../components/Toast';
import { FormSection, AppScreen } from '../../components/ui';
import { api, assertApiOk } from '../../lib/api';

const feedbackTypes = [
  { value: 'bug', label: '问题反馈', icon: 'bug', colorKey: 'danger' },
  { value: 'feature', label: '功能建议', icon: 'lightbulb-outline', colorKey: 'primary' },
  { value: 'other', label: '其他', icon: 'message-text-outline', colorKey: 'gray500' },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const palette = usePalette();
  const [type, setType] = useState('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [errors, setErrors] = useState<{ content?: string }>({});

  const getFeedbackTypeColor = (colorKey: string) => {
    if (colorKey === 'danger') return palette.danger;
    if (colorKey === 'primary') return palette.orange;
    return palette.textMuted;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!content.trim()) {
      setErrors({ content: '请输入反馈内容' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      assertApiOk(await api.feedback.create({
        content: content.trim(),
        contact_info: contact.trim(),
      }), '提交反馈失败');
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Submit feedback error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppScreen contentContainerStyle={styles.content}>
          <FormSection label="反馈类型" required>
            <View style={styles.typeGrid}>
              {feedbackTypes.map((ft) => {
                const typeColor = getFeedbackTypeColor(ft.colorKey);
                return (
                  <TouchableOpacity
                    key={ft.value}
                    style={[
                      styles.typeItem,
                      { borderColor: palette.border, backgroundColor: palette.surface },
                      type === ft.value && { borderColor: palette.orange, backgroundColor: `${palette.orange}18` }
                    ]}
                    onPress={() => setType(ft.value)}
                  >
                    <MaterialCommunityIcons
                      name={ft.icon as any}
                      size={24}
                      color={type === ft.value ? typeColor : palette.textMuted}
                    />
                    <Text style={[
                      styles.typeText,
                      { color: palette.textMuted },
                      type === ft.value && { color: typeColor }
                    ]}>
                      {ft.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormSection>

          <FormSection label="反馈内容" required error={errors.content}>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text },
                errors.content && { borderColor: palette.danger }
              ]}
              value={content}
              onChangeText={(t) => { setContent(t); if (errors.content) setErrors({}); }}
              placeholder="请详细描述您遇到的问题或建议..."
              placeholderTextColor={palette.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: palette.textMuted }]}>{content.length}/500</Text>
          </FormSection>

          <FormSection label="联系方式">
            <TextInput
              style={[
                styles.input,
                { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }
              ]}
              value={contact}
              onChangeText={setContact}
              placeholder="选填，方便我们联系您"
              placeholderTextColor={palette.textMuted}
            />
          </FormSection>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: palette.orange, shadowColor: palette.orange },
              loading && styles.submitBtnDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={[styles.loadingIndicator, { borderColor: '#FFFFFF', borderTopColor: 'transparent' }]} />
            ) : (
              <Text style={[styles.submitBtnText, { color: '#FFFFFF' }]}>提交反馈</Text>
            )}
          </TouchableOpacity>
      </AppScreen>
      <Toast visible={toastVisible} message="感谢您的反馈" type="success" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  typeText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
  textArea: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.lg,
    fontSize: fontSize.xl,
    minHeight: 150,
  },
  input: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.lg,
    fontSize: fontSize.xl,
    height: 48,
  },
  charCount: {
    fontSize: fontSize.sm,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  submitBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
  },
});
