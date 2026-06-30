import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../stores/themeStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import type { LifeTemplate } from '../../types';

interface TemplateCardProps {
  template: LifeTemplate;
  onPress?: () => void;
  onUse?: () => void;
  onDelete?: () => void;
}

export function TemplateCard({ template, onPress, onUse, onDelete }: TemplateCardProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const iconColor = template.color || palette.orange;
  const iconName = template.icon || (template.template_type === 'item' ? 'package-variant' : 'checkbox-marked');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>
            {template.template_type === 'item' ? '物品模板' : '待办模板'}
          </Text>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
            {template.name}
          </Text>
          {template.description ? (
            <Text style={[styles.description, { color: palette.textMuted }]} numberOfLines={2}>
              {template.description}
            </Text>
          ) : null}
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={palette.danger} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons
            name={template.template_type === 'item' ? 'package-variant-closed' : 'checkbox-marked-circle-outline'}
            size={14}
            color={palette.violet}
          />
          <Text style={[styles.metaText, { color: palette.violet }]}>
            {template.template_type === 'item' ? '物品流程' : '待办流程'}
          </Text>
        </View>
        <View style={[styles.metaBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name="history" size={14} color={palette.textMuted} />
          <Text style={[styles.metaText, { color: palette.textMuted }]}>
            已套用 {template.usage_count} 次
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: palette.border }]}>
        <View style={styles.footerHint}>
          <MaterialCommunityIcons name="flash-outline" size={14} color={palette.textMuted} />
          <Text style={[styles.footerHintText, { color: palette.textMuted }]}>一键生成并进入编辑</Text>
        </View>
        {onUse && (
          <TouchableOpacity
            style={[styles.useBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
            onPress={onUse}
          >
            <MaterialCommunityIcons name="plus-circle" size={16} color={palette.orange} />
            <Text style={[styles.useBtnText, { color: palette.orange }]}>使用</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  description: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  metaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerHintText: {
    fontSize: fontSize.xs,
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  useBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
