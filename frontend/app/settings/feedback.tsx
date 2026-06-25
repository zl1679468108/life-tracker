import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Toast } from '../../components/Toast';
import { FormSection } from '../../components/ui';
import { api } from '../../lib/api';

const feedbackTypes = [
  { value: 'bug', label: '问题反馈', icon: 'bug', colorKey: 'danger' },
  { value: 'feature', label: '功能建议', icon: 'lightbulb-outline', colorKey: 'primary' },
  { value: 'other', label: '其他', icon: 'message-text-outline', colorKey: 'gray500' },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const colors = useColors();
  const [type, setType] = useState('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [errors, setErrors] = useState<{ content?: string }>({});

  const getFeedbackTypeColor = (colorKey: string) => {
    if (colorKey === 'danger') return colors.danger;
    if (colorKey === 'primary') return colors.primary;
    return colors.gray[500];
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
      await api.feedback.create({
        content: content.trim(),
        contact: contact.trim(),
      });
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
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.gray[50] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={{ backgroundColor: colors.gray[50] }} contentContainerStyle={styles.content}>
          <FormSection label="反馈类型" required>
            <View style={styles.typeGrid}>
              {feedbackTypes.map((ft) => {
                const typeColor = getFeedbackTypeColor(ft.colorKey);
                return (
                  <TouchableOpacity
                    key={ft.value}
                    style={[
                      styles.typeItem,
                      { borderColor: colors.gray[200], backgroundColor: colors.white },
                      type === ft.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                    ]}
                    onPress={() => setType(ft.value)}
                  >
                    <MaterialCommunityIcons
                      name={ft.icon as any}
                      size={24}
                      color={type === ft.value ? typeColor : colors.gray[400]}
                    />
                    <Text style={[
                      styles.typeText,
                      { color: colors.gray[500] },
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
                { backgroundColor: colors.white, borderColor: colors.gray[200], color: colors.gray[800] },
                errors.content && { borderColor: colors.danger }
              ]}
              value={content}
              onChangeText={(t) => { setContent(t); if (errors.content) setErrors({}); }}
              placeholder="请详细描述您遇到的问题或建议..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.gray[400] }]}>{content.length}/500</Text>
          </FormSection>

          <FormSection label="联系方式">
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.white, borderColor: colors.gray[200], color: colors.gray[800] }
              ]}
              value={contact}
              onChangeText={setContact}
              placeholder="选填，方便我们联系您"
              placeholderTextColor={colors.gray[400]}
            />
          </FormSection>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              loading && styles.submitBtnDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={[styles.loadingIndicator, { borderColor: colors.white, borderTopColor: 'transparent' }]} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.white }]}>提交反馈</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast visible={toastVisible} message="感谢您的反馈" type="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
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
